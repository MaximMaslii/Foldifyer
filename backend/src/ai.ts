import { z } from "zod";
import { geminiEdit, geminiJson } from "./gemini.js";
import type { Colors, Kind } from "./types.js";

/* ── 1. Is the photo usable, and which flat colours go on the plain sides ── */

const hex = { type: "string", description: "#RRGGBB" };
const ReadOut = z.object({
  verdict: z.enum(["ok", "no_subject", "several", "not_dressed", "unclear"]),
  fur: z.string(), fur2: z.string(), inner: z.string(), skin: z.string(), hair: z.string(), top: z.string(), bottom: z.string(), shoes: z.string(),
});
export type PhotoVerdict = z.infer<typeof ReadOut>["verdict"];
const fix = (v: string, d: string) => (/^#[0-9a-f]{6}$/i.test(v) ? v : d);

export async function aiReadPhoto(image: string, kind: Kind): Promise<{ verdict: PhotoVerdict; colors: Colors }> {
  const ask = kind === "pet"
    ? `The photo should show ONE animal (a pet). verdict: ok; no_subject when there is no animal; several when more than one animal is the subject; unclear when the head is not visible or the photo is too dark or blurry.
Colours: fur = main coat colour, fur2 = second coat colour or the paws (same as fur when the coat is plain), inner = inside of the ears. Fill the other colours with #888888.`
    : `The photo should show ONE person. verdict: ok; no_subject when there is no person; several when more than one person is the subject; not_dressed when the person is nude, in underwear or swimwear, or the picture is sexual; unclear when the face is not visible or the photo is too dark or blurry.
Colours: skin, hair, top = main colour of the clothing on the upper body, bottom = trousers or skirt (guess a neutral one when not visible), shoes (guess when not visible). Fill fur, fur2 and inner with #888888.`;
  const p = { type: "object", required: ["verdict", "fur", "fur2", "inner", "skin", "hair", "top", "bottom", "shoes"], properties: { verdict: { type: "string", enum: ["ok", "no_subject", "several", "not_dressed", "unclear"] }, fur: hex, fur2: hex, inner: hex, skin: hex, hair: hex, top: hex, bottom: hex, shoes: hex } };
  const o = ReadOut.parse(await geminiJson("You check photos for a paper-toy app. Be literal.", ask, [image], p, 300));
  return {
    verdict: o.verdict,
    colors: { fur: fix(o.fur, "#B98A5A"), fur2: fix(o.fur2, "#F3E6D3"), inner: fix(o.inner, "#E7A6A0"), skin: fix(o.skin, "#E8B894"), hair: fix(o.hair, "#4A3324"), top: fix(o.top, "#4F7CAC"), bottom: fix(o.bottom, "#3B4252"), shoes: fix(o.shoes, "#2B2B2B") },
  };
}

/* ── 2. The picture: nine square tiles that the app wraps around its own paper template ──
   The template (every fold, cut and glue tab) is drawn by the app in exact millimetres. The model only paints the
   surfaces, as a 3×3 sheet. Tile numbers run left to right, top to bottom; app/src/lib/paper.ts uses the same numbers:
     pet:    0 face          1 side of head   2 top/back of head
             3 chest         4 coat           5 front leg with paw
             6 tail          7 paw from above 8 front of an ear
     person: 0 face          1 side of head   2 hair (top/back of head)
             3 torso front   4 jacket fabric  5 sleeve
             6 trouser leg   7 shoe, side     8 shoe, from above                                                  */

const RULES = `OUTPUT: one square image that is a strict 3×3 grid of nine equal square tiles (three rows of three). The grid lines fall exactly at one third and two thirds of the image, both ways.
- Every tile is filled edge to edge with its own content. No gaps or margins between tiles, no borders, no frames, no rounded corners, no drop shadows, no white background anywhere.
- No text, no numbers, no labels, no arrows.
- Each tile is a FLAT, straight-on surface, like the printed side of a paper box. Not a 3D drawing, not a photo of a toy, no perspective.
- Do NOT draw any template elements: no cut lines, no dashed fold lines, no glue tabs, no outlines, no preview of an assembled figure. The app adds the template itself in exact positions; anything like that in the picture would be printed on the toy by mistake.
- Nothing from one tile may cross into its neighbour.
- The same soft, even light in all nine tiles, no strong shadows and no vignette, so the sides match where they meet at a fold.`;

/** Where the face must sit inside tile 1, so it lands the same way on every toy (and stickers such as glasses fit). */
const FACE_BOX = `Placement inside tile 1, measured from that tile's own edges: the head is upright and symmetrical, not tilted and not turned, looking straight into the camera. Both eyes lie on one horizontal line at 45% of the tile height; one eye is centred at 30% of the tile width and the other at 70%. The nose is on the vertical centre line at about 62% of the height, the mouth at about 72%, and the chin ends at about 90%, so nothing of the face is cut off. Keep the real proportions of this face; only scale and centre it to these positions.`;

export const PROMPT: Record<Kind, string> = {
  pet: `Use my uploaded pet photo as the only source of the animal's appearance. I am making a printable papercraft toy of this exact pet: a cube head on a sitting body, with two front legs, ears and a tail. I need the printed surfaces for it.

${RULES}

ROW 1
Tile 1: the FRONT of the cube head. The pet's real face filling the whole square: the same eyes and eye colour, nose, mouth, whiskers, markings and fur pattern as in the photo. Fur reaches every edge of the tile. No ears, no neck, no background.
${FACE_BOX}
Tile 2: the SIDE of the head: cheek fur in the same colours and pattern, filling the square. No eye, no ear. Along its right edge the fur matches the left edge of tile 1, because these two sides meet at a fold. The face is towards the RIGHT side of this tile and the back of the head towards the left.
Tile 3: the TOP and BACK of the head: only fur, as it looks between and behind the ears, with the real markings (for example the stripes on a tabby's forehead running back).

ROW 2
Tile 4: the CHEST, seen from the front, from the neck down to the belly: the real chest colours and markings (for example a white bib), filling the square. No legs, no head.
Tile 5: the COAT: the fur of the back and sides with the real colours and pattern (stripes, spots or patches where the pet has them), spread evenly over the whole square so it can be used on the back, the sides and the legs.
Tile 6: one FRONT LEG seen from the front, standing upright and filling the square from top to bottom: leg fur above, and the paw with its toes in the lowest quarter. Fur fills the tile to the left and right edges, no background beside the leg.

ROW 3
Tile 7: the TAIL: fur with the tail's own colours and pattern (rings, a dark or white tip), filling the square evenly.
Tile 8: a PAW seen from above: the top of the foot with the toes pointing down, in the paw's real colour, filling the square.
Tile 9: the FRONT OF ONE EAR: an upright triangle whose base is the whole bottom edge of the tile and whose tip touches the middle of the top edge, showing the inside of the ear (skin and fine hairs) with a rim of fur. Outside the triangle, fill the tile with the same fur as tile 5.

Style: realistic, detailed fur, the look of a high-quality printed papercraft model. Preserve the pet's identity completely: the same breed look, colours and markings. Do not change the animal. Not a cartoon, not a plush toy, not a generic cat or dog.`,
  person: `Use my uploaded photo as the only source of the person's appearance. I am making a printable papercraft figure of this exact person: a big cube head on a small body, with arms, legs and shoes. I need the printed surfaces for it.

${RULES}

ROW 1
Tile 1: the FRONT of the cube head. The person's real face with a friendly, natural expression, filling the whole square: the same face shape, skin tone, eyes and eye colour, eyebrows, nose, mouth, facial hair and glasses if present. The fringe or hairline runs along the top of the tile exactly as in the photo. Skin reaches the left, right and bottom edges. No ears, no neck, no shoulders, no background.
${FACE_BOX}
Tile 2: the SIDE of the head: the ear in the middle, the hair above and behind it as in the photo, skin (and beard, if any) in front and below, filling the square. Along its right edge the skin and hair match the left edge of tile 1, because these two sides meet at a fold. The face is towards the RIGHT side of this tile and the back of the head towards the left.
Tile 3: the HAIR seen from above and behind: only hair, the same colour, texture and length (or the same hat or head covering), filling the square.

ROW 2
Tile 4: the FRONT OF THE TORSO from the collar to the waist: exactly the clothes from the photo with the same colours, print, layers, buttons, zip or hood strings, filling the square. No arms, no hands, no head.
Tile 5: the FABRIC of the outer garment on the upper body (the jacket, hoodie, shirt or dress): plain cloth in the same colour and texture, with a seam or two, filling the square. It is used on the back and sides of the torso.
Tile 6: one SLEEVE seen from the front, hanging straight down and filling the square: the same fabric and colour as the sleeve in the photo, with its cuff near the bottom edge. If the arms are bare, fill the tile with the person's skin tone. No hand.

ROW 3
Tile 7: one TROUSER LEG seen from the front, filling the square: the lower-body clothing from the photo (jeans, trousers, skirt fabric or tights) in the same colour and texture. If it is not visible in the photo, choose plain trousers that suit the outfit.
Tile 8: one SHOE seen from the SIDE, toe pointing left, filling the square edge to edge: the upper in the top four fifths and the sole along the bottom edge. Use the shoes from the photo, or plain sneakers that suit the outfit if they are not visible. Fill what is left of the tile with the colour of the shoe's upper.
Tile 9: the same SHOE seen from ABOVE, toe pointing down: the laces or top of the upper filling the square.

Style: clean, realistic, softly lit, the look of a high-quality printed papercraft model. Keep the person clearly recognisable. Do not make the person look older, younger, slimmer or heavier. Fully and normally dressed. Not a cartoon, not a caricature, not a generic character.`,
};

export async function aiAtlas(photo: Buffer, kind: Kind) {
  return geminiEdit(PROMPT[kind], [{ buf: photo, type: "image/jpeg" }]);
}
