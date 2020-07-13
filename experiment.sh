#!/bin/bash
#
DEPLOY_TIMEOUT=1m
TESTING_TIMEOUT=2m
mkdir  -p experimentlog
rm -rf build
nohup node unlockAccount.js &
sleep 20
for  benchmark in $(ls ./benchmark)
do
    rm -rf  experimentlog/$benchmark
    mkdir -p experimentlog/$benchmark
    # copy benchmark to workdir
    rm -rf contracts 
    rm -rf migrations
    cp -rf ./benchmark/${benchmark}/contracts .
    cp -rf ./benchmark/${benchmark}/migrations .
    source=unknown
    attacks=()
    for contract in $(ls ./contracts)
    do
            if [[  $contract != "Migrations.sol" ]]; then
                if [[ $contract == *"Attack_"* ]]; then
                        attacks+=( $contract )
                else
                        source=$contract
                fi
            fi
    done
    echo $benchmark" is the current benchmark! "
    echo $source 
    echo ${attacks[@]}
    for i in {1..8}
    do 
	    echo "run#$i:"
    for attack in ${attacks[@]}:
    do
	    echo $benchmark" will be deployed to private network."
            nohup ./utils/startTruffle.sh >  experimentlog/$benchmark/deploy.log  2>&1 &
            sleep $DEPLOY_TIMEOUT
	    # if deploy not done, wait another deploy timeout
            if [[  $(grep "Saving artifacts..." experimentlog/$benchmark/deploy.log | wc -l) -lt 2 ]]; then
            	sleep $DEPLOY_TIMEOUT
	    fi
            if [[  $(grep "Saving artifacts..." experimentlog/$benchmark/deploy.log | wc -l) -eq 2 ]]; then
                    echo $benchmark" deploy successfully."
	    	    echo $benchmark" under testing..."
                    nohup node silent-server.js  $source  $attack > experimentlog/$benchmark/$attack.log 2>&1 &
                    sleep $TESTING_TIMEOUT
		    # if cannot found violation error at the time, wait anothother testing_timeout.
                    if [[  $(grep "seconds" experimentlog/$benchmark/$attack.log | wc -l) -eq 0 ]]; then
                     	sleep $TESTING_TIMEOUT
		    fi
		    # collect results, whether there is violation error or not.
                    if [[  $(grep "seconds" experimentlog/$benchmark/$attack.log | wc -l) -eq 1 ]]; then
			            echo "collect results..."
                                    echo "${benchmark}'s $attack found a violation"
                                    echo $(grep "invariant" experimentlog/$benchmark/$attack.log)
                                    echo $(grep "seconds" experimentlog/$benchmark/$attack.log)
                                    echo "***************************"
                    fi
            else 
                    echo $benchmark" deployment failure."
            fi
	    if [[ $(pgrep node| wc -l) -gt 0 ]]; then
                echo $1 | sudo -S kill -9 $(pgrep node)
    	    fi
	    if [[ $(pgrep startTruffle| wc -l) -gt 0 ]]; then
             	echo $1 | sudo -S kill -9 $(pgrep startTruffle)
    	    fi
	    sleep 10
    done
    done
done
