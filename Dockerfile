# Używamy oficjalnego obrazu Pythona jako bazy
FROM python:3.13

# Ustaw zmienne środowiskowe:
# - PYTHONDONTWRITEBYTECODE zapobiega tworzeniu plików .pyc
# - PYTHONUNBUFFERED powoduje, że output jest natychmiast przekazywany
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Ustaw katalog roboczy wewnątrz kontenera
WORKDIR /app

# Zainstaluj zależności systemowe (np. netcat do sprawdzania dostępności bazy, gcc dla kompilacji)
RUN apt-get update && apt-get install -y netcat-openbsd gcc

# Skopiuj plik z zależnościami i zainstaluj je
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Skopiuj całą aplikację do kontenera
COPY . /app/

# Skopiuj skrypt entrypoint.sh do katalogu głównego obrazu
COPY entrypoint.sh /entrypoint.sh

# Nadaj uprawnienia wykonania dla entrypoint.sh
RUN chmod +x /entrypoint.sh



# Otwórz port 8000 (domyślny port Django/gunicorna)
EXPOSE 8000

# Ustaw entrypoint na nasz skrypt
ENTRYPOINT ["/entrypoint.sh"]
