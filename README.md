# Hypercomplex

A tool for exploring latin square 4D hypercomplex fractals.

<img src="./assets/img/53766148.webp" width="300">

## What

The Mandelbrot set was so beautiful that everyone wanted a 3D version of it. The first idea was to extend complex numbers into higher dimensions, which gives you the 4D quaternions - but the quaternion Mandelbrot looks very boring. So people tried different routes for years like extending complex numbers with rotations that led to the Mandelbulb, or custom power functions made by hand.

Looking at quaternions and those custom functions, you can see that the $z \to z^2$ rule always comes from a multiplication table that is a Latin square (each symbol appears exactly once per row and column), plus a bunch of sign choices. So I generate all possible Latin‑square tables to see what fractals they produce.

A 4×4 Latin square on {1, i, j, k} has 576 possibilities. Most of them look different only because we’ve renamed the symbols or rotated the table. To clean this up we have quasigroup isomorphism - when you allow renaming the basis elements, the 576 tables collapse into exactly 24 unique algebras. I wasn't able to find them so I grouped them all by hand, rendering them with raymarching, and among the 24 only 6 have a special kind of symmetry. Those 6 are the ones that actually make beautiful, recognisable Mandelbrot‑style shapes.

(In the tool, there’s a table listing all 24 groups with a tiny preview image. The groups that produce good fractals have a coloured preview - the rest are greyed out.)

## Usage

The main canvas shows a 3D slice of the 4D fractal.
Below that we have:
- ID input that encodes the table index (0–575), the signs for all 16 cells of the table (2 bytes, each bit 0=+, 1=−), and the slice plane. The encoding is:
  - id = table_number + sign_flags × 576 + slice × 576*(2^16)
- Slices - 0 (w=0), 1 (z=0), 2 (y=0), 3 (x=0).
- A 4×4 grid of sign buttons.
- An input for table number (0 to 575)
