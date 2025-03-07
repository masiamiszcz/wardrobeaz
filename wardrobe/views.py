import os
import json
from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from .models import cabinetmodel, material
from .forms import CabinetModelForm, MaterialForm
from copy import deepcopy
from lxml import etree

#def home(request):
#    return render(request, 'wardrobe/index.html')
def add_elements_view(request):
    if request.method == 'POST':
        # Rozróżniamy, który formularz został wysłany
        if 'cabinet_model_submit' in request.POST:
            cabinet_form = CabinetModelForm(request.POST)
            material_form = MaterialForm()  # pusty formularz dla drugiego typu
            if cabinet_form.is_valid():
                cabinet_form.save()
                return redirect('add')  # zmień na odpowiednią nazwę URL
        elif 'material_submit' in request.POST:
            material_form = MaterialForm(request.POST)
            cabinet_form = CabinetModelForm()  # pusty formularz dla drugiego typu
            if material_form.is_valid():
                material_form.save()
                return redirect('add')
    else:
        cabinet_form = CabinetModelForm()
        material_form = MaterialForm()

    context = {
        'cabinet_form': cabinet_form,
        'material_form': material_form,
    }
    return render(request, 'wardrobe/add.html', context)

def home(request):
    cabinet_models = cabinetmodel.objects.all()
    mat = material.objects.all()
    context = {
        'cabinet_models': cabinet_models,
        'materials': mat,
    }
    return render(request, 'wardrobe/index.html', context)

def process_list(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            print("dane: ", data)
            added_elements  = data.get('added_elements', [])
            file_path = "/data/data.json"
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w", encoding='utf-8') as outfile:
                json.dump(added_elements, outfile, ensure_ascii=False, indent=4)
            save_list_to_corpus_file()
            return HttpResponse("dane zapisane", status=200)
        except Exception as e:
            return HttpResponse(f"błąd {e}", status=500)
    else:
        return HttpResponse("nieprawidłowe zapytanie", status=400)



def save_list_to_corpus_file():
    # Wczytanie listy elementów z pliku JSON, aktualnie data, pozniej baza danych
    json_file_path = "/data/data.json"
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            addedElements = json.load(f)
    except Exception as e:
        print(f"Błąd wczytania pliku JSON: {e}")
        return

    if not addedElements or len(addedElements) == 0:
        print("Brak elementów w liście addedElements!")
        return

    material_map = {
        "0481_BS": "0481_BS",
        "K003_PW": "K003_PW"
    }

    base_tree = None  # Dokument bazowy (ElementTree)
    i = 0

    # Iteracja po elementach z listy
    for el in addedElements:
        # Założenie: el jest słownikiem zawierającym m.in. "userData" oraz "position"
        user_data = el.get("userData", {})
        position = el.get("position", {})
        wall_offset = el.get("wallOffset", {})

        idname = user_data.get("idname")
        modal_type = user_data.get("elementType")
        dimensions = user_data.get("dimensions", {})

        el_height = round(dimensions.get("height", 0) * 1000)
        el_width  = round(dimensions.get("width", 0) * 1000)
        el_depth  = round(dimensions.get("depth", 0) * 1000)
        el_x = round(position.get("x", 0) * 1000)
        el_y = round(position.get("y", 0) * 1000)
        # Jeśli typ elementu to "wysoka" lub "dolna", dodajemy wall_offset do głębokości
        el_z = el_depth + wall_offset if modal_type in ["wysoka", "dolna"] else el_depth

        # Pobranie nazwy pliku S3D na podstawie idname
        file_name = idname + ".S3D"

        file_path = os.path.join("/models", file_name)
        print(f"Pobieram plik: {file_path}")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                xml_text = f.read()
        except Exception as e:
            print(f"Błąd otwarcia pliku {file_name}: {e}")
            continue

        # Parsowanie XML – tworzymy obiekt drzewa XML
        try:
            current_tree = etree.fromstring(xml_text.encode("utf-8"))
        except Exception as e:
            print(f"Błąd parsowania pliku {file_name}: {e}")
            continue

        # Wyszukiwanie sekcji <ELEMENT>
        xml_element = current_tree.find(".//ELEMENT")
        if xml_element is None:
            print(f"Brak sekcji <ELEMENT> w pliku {file_name}")
            continue

        # Aktualizacja atrybutów sekcji <ELEMENT> jeśli ECLAS="TElement"
        if xml_element.get("ECLAS") == "TElement":
            xml_element.set("EVISINA", str(el_height))
            xml_element.set("EDUBINA", str(el_depth))
            xml_element.set("ESIRINA", str(el_width))
            xml_element.set("EZPOS", str(el_z))
            # Pozycja X ustawiana jako (el_x - el_width/2)
            xml_element.set("EXPOX", str(round(el_x - el_width/2)))
            xml_element.set("EYPOS", str(el_y))

        # Modyfikacja ustawień nóg
        legs_enabled = user_data.get("legsEnabled", False)
        legs_height = round(user_data.get("legHeight", 0) * 1000)
        # Wyszukujemy element EVAR, którego atrybut VAR0 zaczyna się od "@Nozki"
        evar_elements = xml_element.xpath(".//EVAR[starts-with(@VAR0, '@Nozki')]")
        if evar_elements:
            evar = evar_elements[0]
            if legs_enabled:
                evar.set("VAR1", "Ukryj_nozki_1=0")
                evar.set("VAR7", "Wysokosc_nozki=" + str(legs_height))
            else:
                evar.set("VAR1", "Ukryj_nozki_1=1")
                evar.set("VAR7", "Wysokosc_nozki=0")

        # Modyfikacja materiału
        material = user_data.get("material")
        new_material = material_map.get(material, "")
        new_material_value = "P_" + new_material

        # Aktualizacja atrybutów w elementach DASKE
        daske_elements = xml_element.findall(".//DASKE")
        for daske in daske_elements:
            for attr in ["MATNAME", "MATUID", "MATN", "MUID"]:
                if daske.get(attr) is not None:
                    daske.set(attr, new_material_value)
            # Aktualizacja atrybutów dla wszystkich potomnych elementów DASKE
            for child in daske.iter():
                for attr in ["MATNAME", "MATUID", "MATN", "MUID"]:
                    if child.get(attr) is not None:
                        child.set(attr, new_material_value)

        # Jeśli idname nie zawiera "pelne_plecy", modyfikujemy materiał dla elementu AD z atrybutem DNAME="Plecy"
        if "pelne_plecy" not in idname:
            for daske in daske_elements:
                plecy_elements = daske.findall(".//AD[@DNAME='Plecy']")
                for plecy in plecy_elements:
                    for attr in ["MATNAME", "MATUID", "MATN", "MUID"]:
                        plecy.set(attr, "HDF-3MM")

        # Scalanie plików: pierwszy plik staje się dokumentem bazowym, kolejne importujemy jako kopię sekcji <ELEMENT>
        if i == 0:
            base_tree = etree.ElementTree(current_tree)
        else:
            # Importujemy <ELEMENT> z bieżącego pliku – używamy deepcopy, aby skopiować w całości element
            imported_node = deepcopy(xml_element)
            base_root = base_tree.getroot()
            # Wyszukujemy wszystkie istniejące elementy <ELEMENT> w dokumencie bazowym
            existing_elements = base_root.findall(".//ELEMENT")
            if existing_elements:
                # Wstawiamy nowy element po ostatnim znalezionym
                last_element = existing_elements[-1]
                parent = last_element.getparent()
                if parent is not None:
                    idx = list(parent).index(last_element)
                    parent.insert(idx + 1, imported_node)
                else:
                    base_root.append(imported_node)
            else:
                print("Nie znaleziono sekcji <ELEMENT> w pliku bazowym.")
        i += 1

    if base_tree is None:
        print("Nie udało się załadować żadnego pliku.")
        return

    # Ścieżka katalogu wyjściowego
    filepath_s3d = "/shared_data"
    os.makedirs(os.path.dirname(filepath_s3d), exist_ok=True)

    # Bazowa nazwa pliku
    base_filename = "combined_output"
    extension = ".S3D"
    output_file_path = os.path.join(filepath_s3d, base_filename + extension)

    # Sprawdzenie, czy plik istnieje, i dodanie numeracji
    counter = 1
    while os.path.exists(output_file_path):
        output_file_path = os.path.join(filepath_s3d, f"{base_filename}_{counter}{extension}")
        counter += 1

    try:
        base_tree.write(output_file_path, encoding="utf-8", pretty_print=True, xml_declaration=True)
        print("Scalony plik został zapisany jako", output_file_path)
    except Exception as e:
        print("Błąd zapisu scalonego pliku:", e)
