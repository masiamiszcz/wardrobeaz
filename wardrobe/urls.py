from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('process_list/', views.process_list, name='process_list'),
    path('add/', views.add_elements_view, name='add'),
]
