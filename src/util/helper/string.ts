export const formatObjectToString = (object: object) => {
  let output: string = ""

  for(const [sectionName, sectionValue] of Object.entries(object)) {
    output += sectionName + ':\r\n'

    for(const [key, value] of Object.entries(sectionValue))
      output += '  ' + key + ' = ' + value.toString() + '\r\n'

    output += '\r\n'  
  }

  return output
}