import os
for k in ['USE_SQLITE','USE_SQLITE_FILE','PYTHONPATH','DB_HOST','DB_USER','DB_PASSWORD','DB_NAME']:
    print(k,'=',os.environ.get(k))
