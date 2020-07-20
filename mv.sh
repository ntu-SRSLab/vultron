rm -rf contracts 
rm -rf migrations
cp -rf benchmark/$1/contracts .
cp -rf benchmark/$1/migrations .
