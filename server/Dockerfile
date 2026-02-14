FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

# install system deps needed for health checks and DB client
RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl gnupg postgresql-client \
	&& rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV FLASK_APP=run.py
ENV FLASK_ENV=development
EXPOSE 5000

# copy and ensure wait script is executable
RUN if [ -f ./wait_for_db.sh ]; then chmod +x ./wait_for_db.sh; fi

# entrypoint will wait for DB then exec CMD
ENTRYPOINT ["/app/wait_for_db.sh"]
CMD ["flask", "run", "--host=0.0.0.0"]
