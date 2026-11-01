import zipfile,xml.etree.ElementTree as E
from pathlib import Path
p=Path('public/lumen-design-story.pptx')
ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
rel='http://schemas.openxmlformats.org/package/2006/relationships'
for k,v in ns.items():E.register_namespace(k,v)
with zipfile.ZipFile(p) as z: files={n:z.read(n) for n in z.namelist()}
for number,route in [(3,'retail'),(4,'manufacturing'),(5,'healthcare'),(6,'finance')]:
 name=f'ppt/slides/slide{number}.xml';rn=f'ppt/slides/_rels/slide{number}.xml.rels'
 root=E.fromstring(files[name]);rels=E.fromstring(files[rn]);rid='LumenDashboardButton'
 if not any(x.get('Id')==rid for x in rels):E.SubElement(rels,'{'+rel+'}Relationship',{'Id':rid,'Type':ns['r']+'/hyperlink','Target':'https://kentaro-oishi-c3creators.github.io/lumen-analytics/#/'+route,'TargetMode':'External'})
 count=0
 for shape in root.findall('.//p:sp',ns):
  off=shape.find('p:spPr/a:xfrm/a:off',ns)
  if off is not None and int(off.get('x','0'))>=1280*9525 and 750*9525<=int(off.get('y','0'))<=805*9525:
   props=shape.find('p:nvSpPr/p:cNvPr',ns)
   for old in props.findall('a:hlinkClick',ns):props.remove(old)
   E.SubElement(props,'{'+ns['a']+'}hlinkClick',{'{'+ns['r']+'}id':rid});count+=1
 assert count>=2,(number,count)
 files[name]=E.tostring(root,encoding='utf-8',xml_declaration=True);files[rn]=E.tostring(rels,encoding='utf-8',xml_declaration=True)
with zipfile.ZipFile(p,'w',zipfile.ZIP_DEFLATED) as z:
 for n,b in files.items():z.writestr(n,b)
print('Linked button backgrounds, labels and arrows on slides 3–6.')
