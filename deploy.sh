# build project image

docker build -t ntdash/m-client:latest -t ntdash/m-client:$SHA ./client
docker build -t ntdash/m-server:latest -t ntdash/m-server:$SHA ./server
docker build -t ntdash/m-worker:latest -t ntdash/m-worker:$SHA ./worker

# push builed images 
# latest for new applyer
# $GIT_SHA based for usaly dev

docker push ntdash/m-client:latest
docker push ntdash/m-server:latest
docker push ntdash/m-worker:latest

docker push ntdash/m-client:$SHA
docker push ntdash/m-server:$SHA
docker push ntdash/m-worker:$SHA

# kubernetes step

kubectl apply -f k8s

# overite the latest version with a based $GIT_SHA version
kubectl set image deployments/client-deployment client=ntdash/m-client:$SHA
kubectl set image deployments/server-deployment server=ntdash/m-server:$SHA
kubectl set image deployments/worker-deployment worker=ntdash/m-worker:$SHA