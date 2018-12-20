import sys
import json
from slither.slither import Slither  
  
if len(sys.argv) != 2:
    print('python needs one parameter!')
    exit(-1)
# Init slither
slither = Slither(sys.argv[1])

depen_map = {"Read": {}, "Write": {}, "CDepen": {}}

for contract in slither.contracts:  
	for function in contract.functions:
		for node in function.nodes:
			if len(node.state_variables_read) != 0:
				# some source line is in the form of fileName#line-line
				lineStr = node.source_mapping_str.split("-")[0]
				read_var = '{}'.format([svr.name for svr in node.state_variables_read])
				read_map = depen_map["Read"]
				read_map[lineStr] = read_var
			if len(node.state_variables_written) != 0:
				lineStr = node.source_mapping_str.split("-")[0]
				write_var = '{}'.format([svw.name for svw in node.state_variables_written])
				write_map = depen_map["Write"]
				write_map[lineStr] = write_var
					
cond_set = set()
cd_map = {}
for contract in slither.contracts:  
	for function in contract.functions:
		for node in function.nodes:
			if len(node.sons) >= 2:
				# the conditional statement
				cond_set.add(node.source_mapping_str)
			for son in node.sons:
				if node.source_mapping_str not in cd_map:
					cd_list = []
					cd_list.append(son.source_mapping_str)
					cd_map[node.source_mapping_str] = cd_list;
				else:
					cd_list = cd_map[node.source_mapping_str]
					cd_list.append(son.source_mapping_str)

for key, value_set in cd_map.items():
	if key in cond_set:
		key_str = key.split("-")[0]
		value_list = []
		for value in value_set:
			if value.find("-") == -1:
				value_list.append(value)
				# at most two branch, the third is following the whole conditional statement
				if len(value_list) == 2:
					break
		# find the sec branch
		if len(value_list) < 2:
			value_worklist = []
			value_workset = set()
			for value in value_set:
				if value.find("-") != -1:
					value_worklist.append(value)
					value_workset.add(value)
			while len(value_worklist) != 0:
				key = value_worklist.pop()
				key_max = key.split("-")[1]
				sec_found = False
				if key in cd_map:
					valuemap_list = cd_map[key]
					for value in valuemap_list:
						value_item = value.split("-")
						value_min = value_item[0].split("#")[1]
						if int(value_min) > int(key_max):
							value_list.append(value_item[0])
							sec_found = True
							break
						if value not in value_set:
							value_worklist.append(value)
							value_workset.add(value)
				if sec_found:
					break
		cdepen_map = depen_map["CDepen"]
		cdepen_map[key_str] = value_list	

jStr = json.dumps(depen_map)
print(jStr)