# Hypercomplex

A tool for exploring Latin-square 4D hypercomplex fractals.

<img src="./assets/img/53766148.webp" width="300">

## What

The Mandelbrot set was so beautiful that everyone wanted a 3D version of it. The first idea was to extend complex numbers into higher dimensions, which gives you the 4D quaternions - but the quaternion Mandelbrot looks very boring. So people tried different routes for years, such as extending complex numbers with rotations that led to the Mandelbulb, or custom power functions made by hand.

Looking at quaternions and those custom functions, you can see that the $Z \to Z^2$ rule always comes from a multiplication table that is a Latin square (each symbol appears exactly once per row and column), plus a bunch of sign choices. So I generate all possible Latin‑square tables to see what fractals they produce.

A 4×4 Latin square on $\\{1, i, j, k\\}$ has 576 possibilities. Most of them look different only because we’ve renamed the symbols or rotated the table. To clean this up we have quasigroup isomorphism - when you allow renaming the basis elements, the 576 tables collapse into exactly 24 unique algebras. I couldn't find a list of these 24, so I grouped all 576 by hand. Among the 24, only 6 have a special kind of symmetry. Those 6 are the ones that actually make beautiful, recognizable Mandelbrot‑style shapes.

(In the tool, there’s a table listing all 24 groups with a tiny preview image. The groups that produce good fractals have a colored preview - the rest are grayed out.)

## Usage

The main canvas shows a 3D slice of the 4D fractal.  
Below that we have the controls:
- ID input that encodes the table index (0-575), the signs for all 16 cells of the table (2 bytes, each bit 0=+, 1=-), and the slice plane.
  - id = table_number + sign_flags × 576 + slice × 576*(2^16)
- Slices - 0 (w=0), 1 (z=0), 2 (y=0), 3 (x=0).
- A 4×4 grid of sign buttons.
- An input for table number (0 to 575)

## Rendering

Raymarching is used to render the fractals. For that we need a distance estimation function.

For quaternions, the norm is multiplicative ($|Z^2| = |Z|^2$), so the derivative simplifies:

$$
\begin{aligned}
Z &\leftarrow Z^2 + C \\
d &\leftarrow 2 \cdot |Z| \cdot d + 1 \\
DE &= \frac{1}{2} \cdot |Z| \cdot \frac{\log(|Z|)}{|d|}
\end{aligned}
$$

But this is not valid for any other 4D algebra. The multiplication table breaks the norm property, so we have to use the full Jacobian (tracking $\partial x$, $\partial y$, $\partial z$). That is accurate but slow.

To fix it, I used:

$$
d \leftarrow 2 \cdot \frac{|Z^2|}{|Z|} \cdot d + 1
$$

where $Z^2 = mul(Z,Z)$. This works because $\frac{|Z^2|}{|Z|}$ acts like an effective norm factor.

The Jacobian can also be used for normals:

$$
n = normalize
\begin{pmatrix}
\langle Z, \frac{\partial Z}{\partial x} \rangle \\
\langle Z, \frac{\partial Z}{\partial y} \rangle \\
\langle Z, \frac{\partial Z}{\partial z} \rangle
\end{pmatrix}
$$
