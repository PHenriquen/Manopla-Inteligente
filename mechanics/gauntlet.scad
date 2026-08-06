// AEGIS GAUNTLET - modelo 3D paramétrico em OpenSCAD
// Este arquivo gera uma carcaça conceitual de manopla para prototipagem.

$fn = 60;

module gauntlet_shell() {
    difference() {
        union() {
            // Corpo principal da manopla
            hull() {
                translate([0, 0, 0]) sphere(r = 30);
                translate([0, 0, 70]) sphere(r = 24);
            }

            // Base da palma
            translate([0, -10, 20]) cube([70, 45, 20], center = true);
        }

        // Interior vazio
        translate([0, 0, 8]) scale([0.88, 0.88, 0.9]) hull() {
            translate([0, 0, 0]) sphere(r = 30);
            translate([0, 0, 70]) sphere(r = 24);
        }

        // Espaço para dedos
        for (i = [-1, 1]) {
            translate([i * 18, -5, 30]) rotate([90, 0, 0]) cylinder(h = 30, r = 6, center = true);
        }

        // Abertura para painel/LED
        translate([0, 20, 35]) cube([24, 20, 18], center = true);
    }
}

module mounting_bracket() {
    translate([0, -35, 20]) difference() {
        cube([18, 24, 18], center = true);
        translate([0, 0, 4]) cube([10, 18, 12], center = true);
    }
}

difference() {
    gauntlet_shell();
    mounting_bracket();
}

mounting_bracket();
