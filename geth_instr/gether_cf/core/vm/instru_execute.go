package vm

import (
	"strconv"
)

type opFunc func(pc *uint64, interpreter *EVMInterpreter, contract *Contract, memory *Memory, stack *Stack) ([]byte, error)

/// instrument the execution list the instruction opXXX which will be recorded and analyzed later
func instrument_execute(op OpCode, exe_fun opFunc, pc *uint64, interpreter *EVMInterpreter, contract *Contract, memory *Memory, stack *Stack) ([]byte, error) {
	var wstr string = strconv.FormatUint(*pc, 10) + opCodeToString[op]
	op_list = append(op_list, wstr)
	return exe_fun(pc, interpreter, contract, memory, stack)
}
