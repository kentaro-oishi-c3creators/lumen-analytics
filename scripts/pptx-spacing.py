"""Preserve SVG tracking in native PowerPoint text runs."""
import json
import os
import sys
import zipfile
import xml.etree.ElementTree as ET

pptx_path, spacing_path, scene_path = sys.argv[1:4]
with open(scene_path, encoding="utf-8") as source:
    scenes = json.load(source)
with open(spacing_path, encoding="utf-8") as source:
    spacings = json.load(source)
ns = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
for prefix, uri in ns.items():
    ET.register_namespace(prefix, uri)
with zipfile.ZipFile(pptx_path) as source:
    entries = {name: source.read(name) for name in source.namelist()}
for name, raw in list(entries.items()):
    if name.startswith("ppt/slides/slide") and name.endswith(".xml"):
        root = ET.fromstring(raw)
        for shape in root.findall(".//p:sp", ns):
            props = shape.find("p:nvSpPr/p:cNvPr", ns)
            spacing = spacings.get(props.get("name")) if props is not None else None
            if spacing:
                for run in shape.findall(".//a:rPr", ns) + shape.findall(".//a:defRPr", ns):
                    run.set("spc", str(spacing))
        slide_number = int(name.rsplit("slide", 1)[1].split(".")[0])
        images = [e for e in scenes[slide_number - 1]["elements"] if e["type"] == "image"]
        pictures = root.findall(".//p:pic", ns)
        assert len(images) == len(pictures)
        for picture, image in zip(pictures, images):
            fill = picture.find("p:blipFill", ns)
            crop = fill.find("a:srcRect", ns)
            if crop is None:
                crop = ET.SubElement(fill, "{" + ns["a"] + "}srcRect")
            for source_key, xml_key in [("left", "l"), ("top", "t"), ("right", "r"), ("bottom", "b")]:
                crop.set(xml_key, str(round(image["crop"][source_key] * 100000)))
        entries[name] = ET.tostring(root, encoding="utf-8", xml_declaration=True)
with zipfile.ZipFile(pptx_path + ".patched", "w", zipfile.ZIP_DEFLATED) as output:
    for name, raw in entries.items():
        output.writestr(name, raw)
os.replace(pptx_path + ".patched", pptx_path)
