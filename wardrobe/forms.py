# forms.py
from django import forms
from .models import cabinetmodel, material

class CabinetModelForm(forms.ModelForm):
    class Meta:
        model = cabinetmodel
        fields = ['name', 'file_path', 'img_path']  # Upewnij się, że nazwy pól odpowiadają Twoim modelom

class MaterialForm(forms.ModelForm):
    class Meta:
        model = material
        fields = ['code', 'img_path']  # Analogicznie
