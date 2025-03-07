from django.db import models

class cabinetmodel(models.Model):
    name = models.CharField(max_length=120)
    file_path = models.CharField(max_length=500)
    img_path = models.CharField(max_length=500)

    def __str__(self):
        return self.name

class material(models.Model):
    code = models.CharField(max_length=50, unique=True)
    img_path = models.CharField(max_length=500)

    def __str__(self):
        return self.code
