#!/bin/sh

# Opcjonalnie: poczekaj, aż baza danych będzie gotowa
echo "Czekam na gotowość bazy danych..."

# Uruchom migracje bazy danych
echo "Uruchamiam migracje..."
python manage.py makemigrations wardrobe
python manage.py migrate wardrobe --noinput

# Opcjonalnie: zbierz pliki statyczne (jeśli aplikacja tego wymaga)
# echo "Zbieram pliki statyczne..."
# python manage.py collectstatic --noinput

# Uruchom serwer aplikacji (przykładowo przy użyciu gunicorn)
echo "Uruchamiam serwer aplikacji..."
exec python manage.py runserver 0.0.0.0:8000
