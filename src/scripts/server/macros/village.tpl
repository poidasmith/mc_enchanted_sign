# creates a village from templates

1 = house east
2 = house west
3 = house north
4 = house south
f = forest north
t = forest east
c = church 
s = shelter2
o = cow_farm
_ = air
   
   _ _ 3 _ _ _
   f _ w _ c _
   _ _ s _ _ s
   _ 1 r 2 _ _
   _ 1 r 2 _ o
   p _ r _ _ _

# cell is 10x10 space
> grid 10  

# we follow the terrain (find first non-air block at each grid point)
> terrain follow:true