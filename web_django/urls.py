from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("", include("wardrobe.urls")),
    path("admin/", admin.site.urls),
]

# Serwowanie plików media w trybie developerskim
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.MODELIMG_URL, document_root=settings.MODELIMG_ROOT)
    urlpatterns += static(settings.MATERIAL_URL, document_root=settings.MATERIAL_ROOT)
