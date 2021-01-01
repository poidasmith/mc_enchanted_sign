# Enchanged Sign
Minecraft Bedrock scripting addon that allows for "printing" of structures into worlds for fast world building using an "enchanted" sign

## Demo

![Demo](demo.gif)

## Template

The addon uses a simple templating format for easy definition of structures that can be stamped in any direction
* Define variables that are mapped to blocks (or use $ prefix for entities)
* Draw the cube by setting variables in layers from bottom to top
* The template orientation is facing north
* Use tileData argument in the variable to rotate blocks as required
* Optionally specify a base/foundation layer with a margin (e.g. to have a layer of grass underneath the structure)
* Optionally specify an offset (e.g. to place one block layer)

<pre>
# A village house with bed, double-chest, crafting table

_ = air
b = bed 0
c = cobblestone
d = wooden_door
g = glass_pane
h = chest 2
l = wooden_slab
o = torch 4
p = planks
s = stone_stairs 2
t = crafting_table
w = log
v = vine
2 = carpet 5
3 = oak_stairs 2
4 = oak_stairs 3
5 = carpet 3
6 = $
f = fence

    w c c c c c w   w c c c c c w   w c g g g c w   w c c c c c w   w p p p p p w   _ l p p p l _   _ _ _ l _ _ _ 
    c p p p p p c   c t _ h h _ c   c _ _ _ _ _ c   c _ _ _ _ _ c   p p p p p p p   _ l p p p l _   _ _ _ l _ _ _ 
    c p p p p p c   c _ b 2 2 3 c   c _ _ _ _ _ c   c _ _ _ _ _ c   p p p p p p p   _ l p p p l _   _ _ _ l _ _ _ 
    c p p p p p c   c _ 2 2 2 f c   g _ _ _ _ 5 c   c _ _ _ _ _ c   p p p p p p p   _ l p p p l _   _ _ _ l _ _ _ 
    c p p p p p c   c 6 _ _ _ 4 c   c _ _ _ _ _ c   c _ _ _ _ _ c   p p p p p p p   _ l p p p l _   _ _ _ l _ _ _ 
    w c c c c c w   w c c d c c w   w g c d c g w   w c c c c c w   w p p g p p w   _ l p p p l _   _ _ _ l _ _ _ 
    v v s s s _ _   v v _ _ _ _ _   v _ o _ o _ _   v v v _ _ _ _   _ v v _ _ _ _   _ _ v _ _ _ _   _ _ _ _ _ _ _

> base grass margin:1
</pre>

## Build

To build, use standard npm command (download npm from https://phoenixnap.com/kb/install-node-js-npm-on-windows)

<pre>
npm install
</pre>

The build will create a mcpack file under the builds folder - double click on this to install into Minecraft
