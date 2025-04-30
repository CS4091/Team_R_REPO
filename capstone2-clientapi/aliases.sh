alias build-client-api="docker build -t capstoneclient ."
alias capstoneclient="docker run --network host --rm -it -v $(pwd):/app -w /app capstoneclient /bin/bash"
