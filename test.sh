line_seconds='22.123 seconds'
set -- $line_seconds
count=1
TestingTimout=10
seconds=$1
totalSeconds=$((count*TestingTimout ))
echo $((count*TestingTimout ))+$seconds | bc

