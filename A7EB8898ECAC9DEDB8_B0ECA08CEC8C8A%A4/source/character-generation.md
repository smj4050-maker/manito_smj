# 사람 미니미 30종 생성 기록

방식: built-in image_gen (imagegen 스킬), 투명 배경의 원본 PNG 아틀라스 2장. 사용자 제공 미니미 모음은 스타일 참고로 사용했으며 새 캐릭터로 생성했습니다. 별도의 CLI/API 모드는 사용하지 않았습니다.

최종 소스: avatars.js. 생성된 RGBA PNG를 변경 없이 data URL로 포함하고, 각 캐릭터가 표시될 SVG viewBox 좌표를 함께 저장했습니다. 첫 아틀라스는 1448×1086, 두 번째는 1619×971이며 각 5열×3행, 총 30종입니다. 웹에서는 2장의 원본 이미지를 공유해 같은 캐릭터를 여러 번 표시합니다.

최종 프롬프트 A의 핵심 명세:

Create ONE production sprite atlas asset for a Korean retro mini-homepage game. Exactly fifteen distinct original HUMAN chibi mini avatars, five columns and three rows, genuinely transparent background. Complete full-body standing characters centered with transparent padding. Large near-square heads, tiny compact bodies, short limbs, dark crisp outlines, warm faces and rosy cheeks. Hard chunky 2D pixel art inspired by the user's reference, not smooth vector or 3D. Consistent size. Red Santa boy; red/pink Santa girl; forest-green knit; icy-blue bob-haired person; reindeer headband; red scarf and navy coat; pink bow and cardigan; blond glasses and mustard cardigan; auburn hair and mint coat; bun and lavender knit; cream hoodie; red check shirt; blue sweater and glasses; two braids and peach knit; ginger-haired green Christmas elf. No labels, text, watermark or interface buttons.

최종 프롬프트 B의 핵심 명세:

Create ONE additional sprite atlas, exactly fifteen NEW human chibi mini avatars, five columns and three rows, genuinely transparent background. Match the first atlas's crisp pixel style, large heads, tiny bodies, thick outlines, rosy cheeks and frontal standing poses. Keep complete characters inside separated cells. New looks: burgundy knit and cream scarf; blond blue beanie and navy vest; copper curls and teal knit; black hair, glasses and ivory cardigan; brown hair and charcoal hoodie; gray-haired man with glasses and green cardigan; gray curls and dusty rose; dark skin and orange scarf; red hair and plum coat; glasses and navy stripes; chestnut low ponytails and blue jumper; messy blond glasses and olive jacket; red beanie and cream duffle; wavy black hair and red cardigan; tidy beard, glasses and sage-green shirt. No repeated Santa, elf or antler costumes, no labels or UI.


# 크리스마스 나무집과 장식 없는 입체 트리

방식: imagegen 스킬의 built-in image_gen. 배경은 원본 나무집 이미지를 편집하고, 트리는 같은 스타일로 새 투명 PNG를 만들었습니다. CLI/API fallback은 사용하지 않았습니다. 최종 PNG 바이트는 변경 없이 room-background.js의 ROOM_BACKGROUND와 BARE_TREE data URL에 포함했습니다. App.jsx에서 별도 앞뒤 레이어로 표시하며 저장된 treeNotes만 실제 장식으로 그립니다.

최종 프로젝트 자산: source/room-background.js. 작업 이미지 경로는 generated_images/exec-c0014f53-2dca-4176-89bc-bd51a509e7f9.png (배경), generated_images/exec-24ec38d4-61c0-42cf-9b0b-da6c4cbf65a3.png (투명 트리)입니다.

배경 최종 프롬프트:
Use case: precise-object-edit. Edit target: the supplied original cozy Christmas treehouse game background. Remove ONLY the large CENTRAL GROUND-FLOOR Christmas tree completely, its star and every decoration on that tree. Remove its surrounding gift packages too. Reveal the empty continuous red oval rug and wood wall/windows behind it naturally. Keep the entire rest of the image unchanged: same image dimensions and camera, wooden two-storey treehouse, stairway on the left, red curtains and windows, beautiful roof garlands, warm lanterns, snowy forest, right fireplace, upper floor furnishings. The center of the lower room must be an EMPTY unobstructed red oval rug where a separate interactive tree sprite will be added later. No people, no new UI, no text, no extra tree on the rug.

트리 최종 프롬프트:
Use case: background-extraction / precise-object-edit. Asset type: game foreground tree cutout, genuinely TRANSPARENT background. Using the large CENTRAL GROUND-FLOOR pine tree in the supplied Christmas treehouse as style reference, create ONE freestanding BARE fir tree matching its warm detailed pixel illustration style and slightly elevated frontal perspective. Full tree and short visible brown trunk, centered with minimal transparent padding. Rich layered natural dark pine green branches with volumetric light/shadow, rounded spreading tiered boughs, slightly broader lower branches, warm light from right. It MUST have absolutely NO decorations: no ornaments, no balls, no lights, no garlands, no ribbons, no gifts, NO star on top. This is the plain tree participants will decorate interactively. No room, no ground, no rug, no floor, no other objects, no snow, no frame, no text. Alpha transparent around exact tree silhouette, all branches intact.
