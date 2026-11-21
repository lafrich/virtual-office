# v6p-act activity authoring (contract v2)

Art-only. Does not modify `pipeline-v6p-anims` or any app code.

## Regenerate

```
cd /workspace/v6p-act-art && python3 author_squat.py
```

Writes additive sheets to `/workspace/v6p-act-incoming/<same relative v6p paths>.png`
and QA previews to `/workspace/v6p-act-art/qa/`.

`pushup_draw.py` holds the pushup pose/draw helpers.

## Contract v2

Sheet 384x2688 RGBA, 6x24 cells of 64x112, pivot (32,100), dirs se,sw,ne,nw.

| band | clip | frames | ms | emosi | status |
|-----:|------|-------:|---:|-------|--------|
| 0 | squat | 6 | 140 | true | draft_inactive (pixels kept) |
| 4 | pushup | 4 | 160 | false | authored |
| 8 | yoga_sphinx_idle | 4 | 500 | true | reserved_transparent |
| 12 | yoga_puppy_idle | 4 | 500 | false | reserved_transparent |
| 16 | hip_shake | 6 | 120 | true | reserved_transparent |
| 20 | yoga_happy_baby_idle | 4 | 450 | false | reserved_transparent |

A clip is ready only when `status==authored`. Transparent reserved bands
and `draft_inactive` must not be treated as playable.
