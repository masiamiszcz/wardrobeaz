/*
import { addedElements } from './wardrobe.js';

document.getElementById("SaveButton").addEventListener("click", function () {
    console.log("Kliknięto przycisk zapisu.");
    console.log("wczytanie listy");
    console.log(addedElements);
});

console.log("Skrypt załadowany poprawnie.");

document.getElementById("SaveButton").addEventListener("click", function () {
    console.log("Kliknięto przycisk zapisu.");


    // Pobranie zaznaczonego ID korpusu
    let selectedInput = document.querySelector('input[name="selection"]:checked');
    if (!selectedInput) {
        console.error("Nie wybrano żadnego korpusu!");
        return;
    }
    let selectedId = selectedInput.id;

    // Mapowanie ID na plik
    let fileMap = {
        korpus_uni: "korpus_uni.S3D",
        korpus_uni_blat: "korpus_uni_blat.S3D",
        korpus_uni_pelne_plecy: "korpus_uni_pelne_plecy.S3D",
        korpus_uni_blat_pelne_plecy: "korpus_uni_blat_pelne_plecy.S3D"
    };

    let selectedFile = fileMap[selectedId];
    if (!selectedFile) {
        console.error("Nieznane ID korpusu!");
        return;
    }
    console.log(`Wybrany plik: ${selectedFile}`);

    fetch(`/media/${selectedFile}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(text, "text/xml");

            // Modyfikacja wymiarów w elementach ELEMENT z atrybutem ECLAS="TElement"
            let elements = xmlDoc.querySelectorAll("ELEMENT[ECLAS='TElement']");
            elements.forEach(element => {
                element.setAttribute("EVISINA", wardrobeHeight.toString());
                element.setAttribute("EDUBINA", wardrobeDepth.toString());
                element.setAttribute("ESIRINA", wardrobeWidth.toString());
                element.setAttribute("EZPOS", wardrobeDepth.toString());
            });

            // Modyfikacja elementu EVAR dla nożek
            let legsCheckbox = document.getElementById("toggleLegs").checked;
            let evarElement = xmlDoc.querySelector("EVAR[VAR0^='@Nozki']");
            if (evarElement) {
                if (legsCheckbox) {
                    // Nożki są dodane – ustaw ukrycie na 0
                    evarElement.setAttribute("VAR1", "Ukryj_nozki_1=0");

                    // Pobranie wybranej wartości z listy (np. "60mm")
                    let selectedLegValue = document.getElementById("legsHeight").value;
                    let heightNumber = parseInt(selectedLegValue); // np. "60mm" → 60
                    evarElement.setAttribute("VAR7", "Wysokosc_nozki=" + heightNumber);
                } else {
                    // Nożki nie są dodane – ustaw ukrycie na 1 oraz wyzeruj wysokość nóżki
                    evarElement.setAttribute("VAR1", "Ukryj_nozki_1=1");
                    evarElement.setAttribute("VAR7", "Wysokosc_nozki=0");
                }
            } else {
                console.warn("Nie znaleziono elementu EVAR dla nożek.");
            }

            // Aktualizacja materiałów na podstawie wybranej opcji w select
            let materialMap = {
                "o481_bs": "0481_BS",
                "k003_pw": "K003_PW"
            };
            let selectedMaterialValue = document.getElementById("wardrobeMaterial").value;
            let newMaterial = materialMap[selectedMaterialValue];
            if (!newMaterial) {
                console.error("Nieznany materiał szafy!");
            } else {
                let newMaterialValue = "P_" + newMaterial;
                // Aktualizacja atrybutów materiałowych we wszystkich elementach DASKE oraz ich potomkach
                let daskeElements = xmlDoc.querySelectorAll("DASKE");
                daskeElements.forEach(daske => {
                    ["MATNAME", "MATUID", "MATN", "MUID"].forEach(attr => {
                        if (daske.hasAttribute(attr)) {
                            daske.setAttribute(attr, newMaterialValue);
                        }
                    });
                    daske.querySelectorAll("*").forEach(element => {
                        ["MATNAME", "MATUID", "MATN", "MUID"].forEach(attr => {
                            if (element.hasAttribute(attr)) {
                                element.setAttribute(attr, newMaterialValue);
                            }
                        });
                    });
                });
            }
            // Jeśli wybrany korpus (selectedId) nie zawiera "pelne_plecy",
            // to w obrębie DASKE, w elemencie potomnym AD z atrybutem DNAME="Plecy",
            // ustawiamy atrybuty materiałowe na "HDF-3MM"
            if (!selectedId.includes("pelne_plecy")) {
                let daskeElements = xmlDoc.querySelectorAll("DASKE");
                daskeElements.forEach(daske => {
                    let plecyElement = daske.querySelector('AD[DNAME="Plecy"]');
                    if (plecyElement) {
                        plecyElement.setAttribute("MATNAME", "HDF-3MM");
                        plecyElement.setAttribute("MATUID", "HDF-3MM");
                        plecyElement.setAttribute("MATN", "HDF-3MM");
                        plecyElement.setAttribute("MUID", "HDF-3MM");
                    }
                });
            }

            let serializer = new XMLSerializer();
            let updatedXml = serializer.serializeToString(xmlDoc);

            let blob = new Blob([updatedXml], { type: "text/xml" });
            let a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = selectedFile;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            console.log(`Plik ${selectedFile} został zapisany.`);
        })
        .catch(error => console.error("Błąd wczytywania pliku S3D:", error));
});*/
