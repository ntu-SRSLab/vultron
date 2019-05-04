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
				lineStr = node.source_mapping_str[node.source_mapping_str.rfind('/') +1 : ].replace('#', ':')
				lineStr = lineStr.split("-")[0]
				read_var = [svr.name for svr in node.state_variables_read]
				read_map = depen_map["Read"]
				read_map[lineStr] = read_var
			if len(node.state_variables_written) != 0:
				lineStr = node.source_mapping_str[node.source_mapping_str.rfind('/') +1 : ].replace('#', ':')
				lineStr = lineStr.split("-")[0]
				write_var = [svw.name for svw in node.state_variables_written]
				write_map = depen_map["Write"]
				write_map[lineStr] = write_var
					
cond_set = set()
cd_map = {}
for contract in slither.contracts:  
	for function in contract.functions:
		for node in function.nodes:
			node_str = node.source_mapping_str[node.source_mapping_str.rfind('/') +1 : ].replace('#', ':')
			if node_str.find(':') != -1:															
				if len(node.sons) >= 2:
					# the conditional statement
					cond_set.add(node_str)
				for son in node.sons:
					if node_str in cd_map:
						cd_list = cd_map[node_str]
						son_str = son.source_mapping_str[son.source_mapping_str.rfind('/') +1 : ].replace('#', ':')
						if son_str.find(':') != -1:
							cd_list.append(son_str)
					else:
						cd_list = []
						son_str = son.source_mapping_str[son.source_mapping_str.rfind('/') +1 : ].replace('#', ':')
						if son_str.find(':') != -1:
							cd_list.append(son_str)						
							cd_map[node_str] = cd_list;

# print(cd_map)
for cd_key, cd_value_list in cd_map.items():
	if cd_key in cond_set:
		cd_key_str = cd_key.split("-")[0]
		value_list = []
		for value in cd_value_list:
			if value.find("-") == -1:
				value_list.append(value)
				# at most two branch, the third is following the whole conditional statement
				if len(value_list) == 2:
					break
		if len(value_list) < 2:
			cd_key_item = cd_key.split("-")
			cd_key_min = cd_key_item[0].split(":")[1]
			for value in cd_value_list:
				if value.find("-") != -1:
					value_item = value.split("-")
					value_min = value_item[0].split(":")[1]
					if int(cd_key_min) < int(value_min):
						value_list.append(value_item[0])
						# at most two branch, the third is following the whole conditional statement
						if len(value_list) == 2:
							break
		# find the sec branch, the first must be found in above section
		if len(value_list) < 2:
			value_worklist = []
			value_workset = set()
			for value in cd_value_list:
				if value.find("-") != -1:
					value_worklist.append(value)
					value_workset.add(value)
			while len(value_worklist) != 0:
				value = value_worklist.pop()
				value_max = value.split("-")[1]
				sec_found = False
				if value in cd_map:
					valuemap_list = cd_map[value]
					for valuemap in valuemap_list:
						valuemap_item = valuemap.split("-")
						valuemap_min = valuemap_item[0].split(":")[1]
						if int(valuemap_min) > int(value_max):
							value_list.append(valuemap_item[0])
							sec_found = True
							break
						if valuemap not in value_workset and valuemap.find("-") != -1:
							value_worklist.append(valuemap)
							value_workset.add(valuemap)
				if sec_found:
					break
		cdepen_map = depen_map["CDepen"]
		cdepen_map[cd_key_str] = value_list

jStr = json.dumps(depen_map)
print(jStr)