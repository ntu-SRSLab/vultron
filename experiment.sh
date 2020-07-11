#!/bin/bash
#
echo "123" | sudo -S kill -9 $(pgrep node)
echo "123" | sudo -S kill -9 $(pgrep truffle)
DEPLOY_TIMEOUT=2m
TESTING_TIMEOUT=5m
mkdir  -p experimentlog
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
    echo $source, ${attacks[@]}
    for attack in ${attacks[@]}:
    do
            nohup ./utils/startTruffle.sh >  experimentlog/$benchmark/deploy.log  2>&1 &
            sleep $DEPLOY_TIMEOUT
            if [[  $(grep "Saving artifacts..." experimentlog/$benchmark/deploy.log | wc -l) -eq 2 ]]; then
                    # cat deploy.log
                    echo $benchmark, " deploy successfully."
                    nohup node silent-server.js  $source  $attack > experimentlog/$benchmark/$attack.log 2>&1 &
                    sleep $TESTING_TIMEOUT
                    if [[  $(grep "seconds" experimentlog/$benchmark/$attack.log | wc -l) -eq 1 ]]; then
                                    echo "$benchmark 's $attack found violation"
                                    echo $(grep "invariant" experimentlog/$benchmark/$attack.log)
                                    echo $(grep "seconds" experimentlog/$benchmark/$attack.log)
                                    echo "***************************"
                    fi
            else 
                    echo "deploy failed"
            fi
            echo "123" | sudo -S kill -9 $(pgrep node)
            echo "123" | sudo -S kill -9 $(pgrep startTruffle)
            sleep 10
    done
done