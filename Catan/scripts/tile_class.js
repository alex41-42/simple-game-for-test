class Tile {
        constructor(type = "water", tileset = images["tileset"]) {
            this.type = type;
            this.tileset = tileset;
            this.edges = "";
            this.variant = Math.random();
            this.diagonal = 0;
            this.x = 0;
            this.y = 0;
        }
        
        set(X = 0, Y = 0){ 
            if (this.type === "empty") return;
            if (this.type === "object") {
                this.x = X;
                this.y = Y;
                return;
            }
            let coor = pointers[this.type][this.edges] 
                ?? pointers[this.type][""];
            
            let index = Math.floor(this.variant * coor.length) * Math.round(Math.random()*Math.random());

            this.x = coor[index][0];
            this.y = coor[index][1];
        }
        
        edging(U,D,L,R, UL,UR,DL,DR){
            if (this.type === "empty") return;
            if (this.type === "object") return;
            let my = order[this.type];

            let u = order[U.type] > my;
            let d = order[D.type] > my;
            let l = order[L.type] > my;
            let r = order[R.type] > my;

            let ul = order[UL.type] > my;
            let ur = order[UR.type] > my;
            let dl = order[DL.type] > my;
            let dr = order[DR.type] > my;

            this.edges = "";

            if (u) this.edges += "u";
            if (d) this.edges += "d";
            if (l) this.edges += "l";
            if (r) this.edges += "r";

            // diagonales seulement si aucun bord direct
            if (!u && !d && !l && !r) {
                this.diagonal = 0;
                if (ul) this.edges = "lu", this.diagonal += 1;
                if (ur) this.edges = "ru", this.diagonal += 1;
                if (dl) this.edges = "ld", this.diagonal += 1;
                if (dr) this.edges = "rd", this.diagonal += 1;
            }
        }

        smoothing(){
            if (this.type === "empty") return;
            if (this.type === "object") return;
            const reverseOrder = ["water","sand","grass","forest","mountain"];
            const currentIndex = order[this.type];
            if (currentIndex === undefined || currentIndex >= reverseOrder.length - 1) return;
            if (this.edges.length >= 3 || this.diagonal >= 2) {
                this.type = reverseOrder[currentIndex + 1];
            } else if (this.edges === "ud" || this.edges === "lr") {
                this.type = reverseOrder[currentIndex + 1];
            }
        }
        
        draw(x,y){
            if (this.type === "empty") return;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                this.tileset,
                // x, y tileset
                this.x * TILESET_SIZE,
                this.y * TILESET_SIZE,
                TILESET_SIZE,
                TILESET_SIZE,
                // x, y screen
                x,
                y,
                TILE_SIZE,
                TILE_SIZE
            );
        }
    }
