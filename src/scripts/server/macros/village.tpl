# creates a village from templates

1 = house west
2 = house east
3 = house north
f = forest west
c = church east
s = shelter2
o = cow_farm
r = road
p = patch west
w = well
_ = empty
   
   _ _ 3 _ _ _
   f _ w _ c _
   _ _ s _ _ s
   _ 1 r 2 _ _
   _ 1 r 2 _ o
   p _ r _ _ _

# cell is 10x10 space
> grid spacing:10  

# we follow the terrain (find first non-air block at each grid point)
> terrain follow:true