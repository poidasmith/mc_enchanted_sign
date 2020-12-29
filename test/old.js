system.house = function (position, direction) {
    let { x, y, z } = position;

    if (direction == 8) {

        // clear the space first
        this.fill("air", x - 6, y, z + 1, x + 6, y + 6, z + 11);

        // floor
        this.fill("cobblestone", x - 4, y, z + 1, x + 4, y, z + 11);

        // ceiling
        this.fill("planks", x - 4, y + 5, z + 1, x + 4, y + 5, z + 11);

        // upright beams
        this.fill("log", x - 4, y, z + 1, x - 4, y + 5, z + 1);
        this.fill("log", x + 4, y, z + 1, x + 4, y + 5, z + 1);
        this.fill("log", x - 4, y, z + 11, x - 4, y + 5, z + 11);
        this.fill("log", x + 4, y, z + 11, x + 4, y + 5, z + 11);

        // walls
        this.fill("cobblestone", x - 3, y + 1, z + 1, x + 3, y + 4, z + 1);
        this.fill("cobblestone", x - 3, y + 1, z + 11, x + 3, y + 4, z + 11);
        this.fill("cobblestone", x + 4, y + 1, z + 2, x + 4, y + 4, z + 10);
        this.fill("cobblestone", x - 4, y + 1, z + 2, x - 4, y + 4, z + 10);

        // doors and windows
        this.fill("wooden_door", x, y + 1, z + 1, x, y + 2, z + 1);
        this.fill2("stone_stairs", x - 1, y, z, x + 1, y, z, 2);
        this.fill("glass_pane", x - 2, y + 2, z + 1, x - 2, y + 3, z + 1);
        this.fill("glass_pane", x + 2, y + 2, z + 1, x + 2, y + 3, z + 1);

        this.fill("glass_pane", x + 4, y + 2, z + 3, x + 4, y + 3, z + 3);
        this.fill("glass_pane", x + 4, y + 2, z + 5, x + 4, y + 3, z + 5);
        this.fill("glass_pane", x + 4, y + 2, z + 7, x + 4, y + 3, z + 7);
        this.fill("glass_pane", x + 4, y + 2, z + 9, x + 4, y + 3, z + 9);

        this.fill("glass_pane", x - 4, y + 2, z + 3, x - 4, y + 3, z + 3);
        this.fill("glass_pane", x - 4, y + 2, z + 5, x - 4, y + 3, z + 5);
        this.fill("glass_pane", x - 4, y + 2, z + 7, x - 4, y + 3, z + 7);
        this.fill("glass_pane", x - 4, y + 2, z + 9, x - 4, y + 3, z + 9);

        this.fill("glass_pane", x - 3, y + 2, z + 11, x + 3, y + 3, z + 11);

        // roof

        this.fill2("oak_stairs", x - 5, y + 5, z, x + 5, y + 5, z, 2);
        this.fill2("oak_stairs", x - 5, y + 5, z + 12, x + 5, y + 5, z + 12, 3);
        this.fill2("oak_stairs", x + 5, y + 5, z, x + 5, y + 5, z + 12, 1);
        this.fill2("oak_stairs", x - 5, y + 5, z, x - 5, y + 5, z + 12, 8);

        this.fill2("oak_stairs", x - 4, y + 6, z + 1, x + 4, y + 6, z + 1, 2);
        this.fill2("oak_stairs", x - 4, y + 6, z + 11, x + 4, y + 6, z + 11, 3);
        this.fill2("oak_stairs", x + 4, y + 6, z + 1, x + 4, y + 6, z + 11, 1);
        this.fill2("oak_stairs", x - 4, y + 6, z + 1, x - 4, y + 6, z + 11, 8);

    } else if (direction === 0) {

        // clear the space first
        this.fill("air", x - 6, y, z - 1, x + 6, y + 6, z - 11);

        // floor
        this.fill("cobblestone", x - 4, y, z - 1, x + 4, y, z - 11);

        // ceiling
        this.fill("planks", x - 4, y + 5, z - 1, x + 4, y + 5, z - 11);

        // upright beams
        this.fill("log", x - 4, y, z - 1, x - 4, y + 5, z - 1);
        this.fill("log", x + 4, y, z - 1, x + 4, y + 5, z - 1);
        this.fill("log", x - 4, y, z - 11, x - 4, y + 5, z - 11);
        this.fill("log", x + 4, y, z - 11, x + 4, y + 5, z - 11);


        // walls
        this.fill("cobblestone", x - 3, y + 1, z - 1, x + 3, y + 4, z - 1);
        this.fill("cobblestone", x - 3, y + 1, z - 11, x + 3, y + 4, z - 11);
        this.fill("cobblestone", x + 4, y + 1, z - 2, x + 4, y + 4, z - 10);
        this.fill("cobblestone", x - 4, y + 1, z - 2, x - 4, y + 4, z - 10);


        // doors and windows
        this.fill("wooden_door", x, y + 1, z - 1, x, y + 2, z - 1);
        this.fill2("stone_stairs", x - 1, y, z, x + 1, y, z, 3);
        this.fill("glass_pane", x - 2, y + 2, z - 1, x - 2, y + 3, z - 1);
        this.fill("glass_pane", x + 2, y + 2, z - 1, x + 2, y + 3, z - 1);

        this.fill("glass_pane", x + 4, y + 2, z - 3, x + 4, y + 3, z - 3);
        this.fill("glass_pane", x + 4, y + 2, z - 5, x + 4, y + 3, z - 5);
        this.fill("glass_pane", x + 4, y + 2, z - 7, x + 4, y + 3, z - 7);
        this.fill("glass_pane", x + 4, y + 2, z - 9, x + 4, y + 3, z - 9);

        this.fill("glass_pane", x - 4, y + 2, z - 3, x - 4, y + 3, z - 3);
        this.fill("glass_pane", x - 4, y + 2, z - 5, x - 4, y + 3, z - 5);
        this.fill("glass_pane", x - 4, y + 2, z - 7, x - 4, y + 3, z - 7);
        this.fill("glass_pane", x - 4, y + 2, z - 9, x - 4, y + 3, z - 9);

        this.fill("glass_pane", x - 3, y + 2, z - 11, x + 3, y + 3, z - 11);

        // roof

        this.fill2("oak_stairs", x - 5, y + 5, z, x + 5, y + 5, z, 3);
        this.fill2("oak_stairs", x - 5, y + 5, z - 12, x + 5, y + 5, z - 12, 2);
        this.fill2("oak_stairs", x + 5, y + 5, z, x + 5, y + 5, z - 12, 1);
        this.fill2("oak_stairs", x - 5, y + 5, z, x - 5, y + 5, z - 12, 8);

        this.fill2("oak_stairs", x - 4, y + 6, z - 1, x + 4, y + 6, z - 1, 3);
        this.fill2("oak_stairs", x - 4, y + 6, z - 11, x + 4, y + 6, z - 11, 2);
        this.fill2("oak_stairs", x + 4, y + 6, z - 1, x + 4, y + 6, z - 11, 1);
        this.fill2("oak_stairs", x - 4, y + 6, z - 1, x - 4, y + 6, z - 11, 8);

    } else if (direction == 4) {


    }
};