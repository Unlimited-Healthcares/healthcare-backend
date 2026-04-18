# initialize docker - First thing to do and if it already has a process, leave it
sudo dockerd

# kill and start docker
docker compose down
docker compose build
docker compose up -d



# check logs

docker logs -f healthcare-backend-api-1


#check running process and containers
docker compose ps

# check postgres database of the container
docker exec -it healthcare-backend-postgres-1 psql -U postgres -d healthcare


# install pacckages directly on docker e.g moment package
docker exec -it healthcare-backend-api-1 sh
ls node_modules/moment
