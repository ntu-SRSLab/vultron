#!/bin/bash
#
Password=$1

Fixed1LenSeedPolicy=1
Fixed2LenSeedPolicy=2
RandomLenSeedPolicy=3
FullLenSeedPolicy=4

ZeroParamSeedPolicy=0
RandomParamSeedPolicy=1

DEPLOY_TIMEOUT=60
TESTING_TIMEOUT=10
Maximum_TIMEMOUT=120

execute_experiment(){
                curSeedLenPolicy=$1
                curSeedParamPolicy=$2
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
                        if [[ ! -d  ./benchmark/${benchmark}/contracts ]]; then
                                        continue
                        fi
                        if [[ ! -d  ./benchmark/${benchmark}/migrations ]]; then
                                        continue
                        fi
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
                        arrayLen=${#attacks[@]}
                        if [[  $arrayLen -eq 0  ]]; then
                                continue
                        fi
                        echo $benchmark" is the current benchmark! "
                        echo $source 
                        echo ${attacks[@]}
                        for i in {1..8}
                        do 
                                echo "run#$i:"
                                echo $benchmark" will be deployed to private network."
                                nohup ./utils/startTruffle.sh >  experimentlog/$benchmark/deploy.log  2>&1 &
                                sleep $DEPLOY_TIMEOUT
                                if [[  $(grep "Saving artifacts..." experimentlog/$benchmark/deploy.log | wc -l) -eq 2 ]]; then
                                                echo $benchmark" deploy successfully."
                                                echo $benchmark" under testing..."
                                                index=0
                                                count=0
                                                for attack in ${attacks[@]}:
                                                do
                                                                index=$(( index + 1))
                                                                nohup node silent-server.js  $source  $attack $curSeedLenPolicy  $curSeedParamPolicy > experimentlog/$benchmark/$attack.log 2>&1 &
                                                                if [[   $index  -lt $arrayLen  ]]; then 
                                                                        sleep $TESTING_TIMEOUT
                                                                else 
                                                                        sleep $Maximum_TIMEMOUT
                                                                fi
                                                                # collect results, whether there is violation error or not.
                                                                if [[  $(grep "seconds" experimentlog/$benchmark/$attack.log | wc -l) -eq 1 ]]; then
                                                                                echo "collect results..."
                                                                                echo "${benchmark}'s $attack found a violation"
                                                                                echo $(grep "invariant" experimentlog/$benchmark/$attack.log)
                                                                                line_seconds=$(grep "seconds" experimentlog/$benchmark/$attack.log)
                                                                                set -- $line_seconds
                                                                                seconds=$1
                                                                                totalSeconds=$(echo $(( count*TESTING_TIMEOUT ))+$seconds | bc)
                                                                                echo "total seconds:",  $totalSeconds
                                                                                echo "***************************"
                                                                                break;
                                                                else 
                                                                        if [[   $index  -lt $arrayLen  ]]; then 
                                                                                count=$((count+1))
                                                                        else 
                                                                                echo "testing timout:",  $(echo $(( count*TESTING_TIMEOUT ))+$Maximum_TIMEMOUT | bc)
                                                                                echo "***************************"
                                                                        fi
                                                                fi
                                                                if [[ $(pgrep node| wc -l) -gt 0 ]]; then
                                                                                echo $Password | sudo -S kill -9 $(pgrep node)
                                                                fi
                                                                sleep  3                                
                                                done
                                else 
                                                echo $benchmark" deployment failure."
                                fi
                                if [[ $(pgrep node| wc -l) -gt 0 ]]; then
                                                echo $Password | sudo -S kill -9 $(pgrep node)
                                fi
                                if [[ $(pgrep startTruffle| wc -l) -gt 0 ]]; then
                                                echo $Password | sudo -S kill -9 $(pgrep startTruffle)
                                fi
                                sleep 3
                                echo $Password | sudo -S kill -9 $(pgrep runAleth.sh) ;
                                echo $Password | sudo -S kill -9 $(pgrep aleth) ;
                                (cd ../AlethWithTraceRecorder/bootstrap-scripts/aleth-ethereum && ./runAleth.sh cslliuye > aleth.log 2>&1 &)
                                sleep 20
                                nohup node unlockAccount.js &
                                sleep 20
                        done
                done
}

echo "strategy: Fixed1LenSeedPolicy-ZeroParamSeedPolicy"
execute_experiment  $Fixed1LenSeedPolicy $ZeroParamSeedPolicy
echo  "done"
echo "strategy: Fixed1LenSeedPolicy-RandomParamSeedPolicy"
execute_experiment  $Fixed1LenSeedPolicy  $RandomParamSeedPolicy
echo  "done"
echo "strategy: Fixed2LenSeedPolicy-ZeroParamSeedPolicy"
execute_experiment  $Fixed2LenSeedPolicy  $ZeroParamSeedPolicy
echo "done"
echo "strategy: Fixed2LenSeedPolicy-RandomParamSeedPolicy"
execute_experiment  $Fixed2LenSeedPolicy  $RandomParamSeedPolicy
echo "done"

echo "strategy: RandomLenSeedPolicy-ZeroParamSeedPolicy"
execute_experiment  $RandomLenSeedPolicy $ZeroParamSeedPolicy
echo  "done"
echo "strategy: RandomLenSeedPolicy-RandomParamSeedPolicy"
execute_experiment  $RandomLenSeedPolicy  $RandomParamSeedPolicy
echo  "done"
echo "strategy: FullLenSeedPolicy-ZeroParamSeedPolicy"
execute_experiment  $FullLenSeedPolicy  $ZeroParamSeedPolicy
echo "done"
echo "strategy: FullLenSeedPolicy-RandomParamSeedPolicy"
execute_experiment  $FullLenSeedPolicy  $RandomParamSeedPolicy
echo "done"


