FROM ubuntu

RUN apt update
RUN apt install -y python3 python3-pip
RUN pip3 install Flask==2.1.0
RUN pip3 install requests==2.27.1

WORKDIR /app

COPY . .

CMD ["python3", "-m", "flask", "run", "--host=0.0.0.0", "--port=80"]