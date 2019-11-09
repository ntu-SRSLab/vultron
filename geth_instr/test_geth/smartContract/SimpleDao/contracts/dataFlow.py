import sys
from slither.slither import Slither  
  
if len(sys.argv) != 2:
    print('python needs one parameter!')
    exit(-1)
# Init slither
slither = Slither(sys.argv[1])
ddFilePath = "./dataD.txt"
cdFilePath = "./controlD.txt"

try:
	ddFile = open(ddFilePath, 'w')
	for contract in slither.contracts:  
		for function in contract.functions:
			for node in function.nodes:
				if len(node.state_variables_read) != 0:
					# some source line is in the form of fileName#line-line
					lineStr = node.source_mapping_str.split("-")[0]
					ddStr = 'R:{}:{}\n'.format(lineStr, [svr.name for svr in node.state_variables_read])
					ddFile.write(ddStr)
				if len(node.state_variables_written) != 0:
					lineStr = node.source_mapping_str.split("-")[0]
					ddStr = 'W:{}:{}\n'.format(lineStr, [svw.name for svw in node.state_variables_written])
					ddFile.write(ddStr)
except IOError as err:
	print("data file error!")
finally:
	if ddFile:
		ddFile.close()
					
try:
	cdFile = open(cdFilePath, 'w')
	cond_set = set()
	cd_map = {}
	for contract in slither.contracts:  
		for function in contract.functions:
			for node in function.nodes:
				nodeStr = node.source_mapping_str.split("-")[0]
				if len(node.sons) >= 2:
					# the conditional statement
					cond_set.add(nodeStr)
				for son in node.sons:
					if node.source_mapping_str != son.source_mapping_str:
						sonStr = son.source_mapping_str.split("-")[0]
						if nodeStr not in cd_map:
							cd_list = []
							cd_list.append(sonStr)
							cd_map[nodeStr] = cd_list;
						else:
							cd_list = cd_map[nodeStr]
							cd_list.append(sonStr)

	for key, value in cd_map.items():
		if key in cond_set:
			if len(value) > 2:
				value = value[:2]
			cdStr = '{}:{}\n'.format(key, value)
			cdFile.write(cdStr)
except IOError as err:
	print("control file error!")
finally:
	if cdFile:
		cdFile.close()