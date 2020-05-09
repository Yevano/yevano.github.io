---
layout: post
title:  "Rotations"
---

\\[
    \newcommand{\mb}[1]{\mathbf #1}
    \newcommand{\bb}[1]{\mathbb #1}
    \newcommand{\p}[1]{\left(#1\right)}
    \newcommand{\norm}[1]{\lvert #1 \rvert}
\\]

I've been working on some Direct3D code lately, and had to learn/relearn a lot of math for doing perspective projection, vertex transforms, rotations, etc. Perhaps the most difficult piece was learning for the first time how to do rotations with quaternions and how to implement them in code. This post will move us gradually from the simplest forms of rotation to more powerful representations that help us to avoid annoying issues such as gimbal lock.

### 2D
First, I think it's important to remember that a rotation is just an operation on some point on a plane that moves it smoothly along the surface (edge) of a circle by some arc length (angle in radians multiplied by the radius of the circle). It is convenient to represent the points using vectors. I.e., a rotation is a function $$\mb R \p {\theta,v} = w$$ of some angle $$\theta \in \bb R$$ and vector $$v \in \bb R ^ 2$$, that maps to a vector $$w \in \bb R ^ 2$$ where $$\theta$$ is an arc length along the unit circle, $$v$$ is the vector that points to the starting point of the arc we wish to rotate along, and $$w$$ points to the clockwise endpoint of that arc with radius $$r = \norm v$$ and length $$\theta r$$.

<div align="center">
    <script type="text/tikz">
        \begin{tikzpicture}
            \draw[step=3, gray, very thin] (-5, -5) grid (5, 5);
            \draw[thick,<->] (-5, 0) -- (5, 0);
            \draw[thick,<->] (0, -5) -- (0, 5);
            \draw (0, 0) circle (3);
            \draw[fill=black] (0, 0) circle (0.1);
            \draw[thick, ->] (0, 0) -- (30:3) node[pos = 0.5, above] { $v$ };
            \draw[thick, ->] (0, 0) -- (130:3) node[pos = 0.5, above] { $w$ };
            \draw (30:0.5) arc (30:130:0.5) node[pos = 0.5, above right] { $\theta$ };
        \end{tikzpicture}
    </script>
</div>

$$\mb R \p { \theta, v }$$ can be easily expressed using a rotation matrix:
$$
    \begin{aligned}
        \begin{bmatrix}
            cos\:\theta & -sin\:\theta \\ sin\:\theta & cos\:\theta
        \end{bmatrix} v
    \end{aligned}
$$.

### Euler angles
Euler angles are a simple solution to rotation in 3D. They represent yaw, pitch, and roll, which we will call $$\varphi$$, $$\theta$$, and $$\psi$$, respectively. Using just these we can represent whatever orientation* we like. We'll look at two categories of rotation that can be performed using Euler angles.

#### Orientation independent rotation
Similarly to the 2D case, we perform any 3D rotation on a particular plane. The simplest solution is to rotate around three mutually perpendicular planes. Namely, the XY , XZ, and YZ planes will be used here. Referring again to the 2D case, there is a rotation matrix for each of these planes that we can apply to a vector we wish to rotate.

$$
    \begin{aligned}
        \mb R_x \p { \theta } =
        \begin{bmatrix}
            \phantom {-cos\:} 1 & \phantom {-cos\:} 0 & \phantom {-cos\:} 0 \\
            \phantom {-cos\:} 0 & \phantom {-} cos\:\theta & -sin\:\theta \\
            \phantom {-cos\:} 0 & \phantom {-} sin\:\theta & \phantom {-} cos\:\theta
        \end{bmatrix}
    \end{aligned}
$$

Putting it all together, we get
$$
    \begin{aligned}
        \mb R \p { \theta, \varphi, \psi }
        = \mb R_z \p { \theta } \mb R_y \p { \varphi } \mb R_x \p { \psi }
    \end{aligned}
$$, 
and $$\mb R \p { \theta, \varphi, \psi } v$$ gives us the rotated vector given an initial vector $$v$$.

<style>
    .smallmath {
        font-size: 75%;
    }
</style>
<div class="smallmath">
    *Orientation differs subtly from rotation. Just think of orientation as being absolute, and rotation as being relative. Alternatively, orientation describes the mapping of a rotated coordinate system to the reference coordinate system, while rotation is the operation that maps any particular coordinate system to a rotated one. In other words, rotation simply acts on an already established orientation. In the 2D case, we could use \(R \p { -\alpha, v }\) to adjust \(v\) from its orientation frame defined by \(\theta\) back to the reference coordinate system. In the same way, the orientation defined by \(\alpha\) can be rotated, with \(\gamma = \alpha + \beta\) giving us \(\gamma\) as a new orientation.
</div>

<div id="euler" align="center">
<div>

<script src="/assets/js/three.js"></script>
<script src="/assets/js/euler.js"></script>