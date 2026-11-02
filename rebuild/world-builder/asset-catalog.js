/* Reuses original Virtual Office / rebuild assets as independent 3D scene objects.
 * The SVGs are existing 2D artwork. Collision and future actions are separate metadata.
 */
window.VLAssetCatalog=Object.freeze([
  {
    "id": "bed",
    "label": "Bed",
    "file": "bed_base.svg",
    "front": "bed_front.svg",
    "width": 3.3,
    "height": 2.8,
    "pivotY": 0.7375,
    "group": "Home & Living",
    "collision": true
  },
  {
    "id": "nightstand",
    "label": "Nightstand",
    "file": "nightstand_base.svg",
    "front": null,
    "width": 1.2,
    "height": 1.6,
    "pivotY": 0.79,
    "group": "Home & Living",
    "collision": true
  },
  {
    "id": "lamp",
    "label": "Bedside Lamp",
    "file": "lamp_base.svg",
    "front": null,
    "width": 1.2,
    "height": 2.5,
    "pivotY": 0.79,
    "group": "Home & Living",
    "collision": false
  },
  {
    "id": "desk",
    "label": "Work Desk",
    "file": "desk_base.svg",
    "front": null,
    "width": 3.2,
    "height": 2.9,
    "pivotY": 0.79,
    "group": "Interior / Fixtures",
    "collision": true
  },
  {
    "id": "chair",
    "label": "Chair",
    "file": "chair_base.svg",
    "front": "chair_front.svg",
    "width": 1.9,
    "height": 2.4,
    "pivotY": 0.7375,
    "group": "Interior / Fixtures",
    "collision": true
  },
  {
    "id": "bookshelf",
    "label": "Bookshelf",
    "file": "bookshelf_base.svg",
    "front": null,
    "width": 2.2,
    "height": 3.4,
    "pivotY": 0.79,
    "group": "Interior / Fixtures",
    "collision": true
  },
  {
    "id": "plant",
    "label": "Plant",
    "file": "plant_base.svg",
    "front": null,
    "width": 2,
    "height": 3.4,
    "pivotY": 0.79,
    "group": "Interior / Fixtures",
    "collision": true
  },
  {
    "id": "rug",
    "label": "Rug",
    "file": "rug_base.svg",
    "front": null,
    "width": 3.7,
    "height": 0.5,
    "pivotY": 0.79,
    "group": "Home & Living",
    "collision": false
  },
  {
    "id": "bathtub",
    "label": "Bathtub",
    "file": "bathtub_base.svg",
    "front": "bathtub_front.svg",
    "width": 3.8,
    "height": 2.5,
    "pivotY": 0.7375,
    "group": "Interior / Fixtures",
    "collision": true
  },
  {
    "id": "shower",
    "label": "Shower",
    "file": "shower_base.svg",
    "front": null,
    "width": 1.6,
    "height": 4.2,
    "pivotY": 0.79,
    "group": "Interior / Fixtures",
    "collision": true
  },
  {
    "id": "partition",
    "label": "Glass Partition",
    "file": "partition_base.svg",
    "front": null,
    "width": 2.2,
    "height": 4,
    "pivotY": 0.79,
    "group": "Interior / Fixtures",
    "collision": true
  },
  {
    "id": "sink",
    "label": "Sink",
    "file": "sink_base.svg",
    "front": null,
    "width": 1.7,
    "height": 2.5,
    "pivotY": 0.79,
    "group": "Interior / Fixtures",
    "collision": true
  },
  {
    "id": "mirror",
    "label": "Mirror",
    "file": "mirror_base.svg",
    "front": null,
    "width": 1.3,
    "height": 2.6,
    "pivotY": 0.79,
    "group": "Interior / Fixtures",
    "collision": false
  },
  {
    "id": "toilet",
    "label": "Toilet",
    "file": "toilet_base.svg",
    "front": "toilet_front.svg",
    "width": 2.1,
    "height": 2.2,
    "pivotY": 0.7375,
    "group": "Interior / Fixtures",
    "collision": true
  },
  {
    "id": "dresser",
    "label": "Dresser",
    "file": "dresser_base.svg",
    "front": null,
    "width": 2.4,
    "height": 2.7,
    "pivotY": 0.79,
    "group": "Home & Living",
    "collision": true
  },
  {
    "id": "door",
    "label": "Door",
    "file": "door_base.svg",
    "front": null,
    "width": 2.4,
    "height": 3.8,
    "pivotY": 0.79,
    "group": "Home & Living",
    "collision": true
  },
  {
    "id": "park_bench",
    "label": "Park Bench",
    "file": "park_bench_base.svg",
    "front": "park_bench_front.svg",
    "width": 3.9,
    "height": 2.7,
    "pivotY": 0.7375,
    "group": "Street / Park",
    "collision": true
  },
  {
    "id": "park_lounger",
    "label": "Park Lounger",
    "file": "park_lounger_base.svg",
    "front": "park_lounger_front.svg",
    "width": 3.5,
    "height": 2.6,
    "pivotY": 0.7375,
    "group": "Street / Park",
    "collision": true
  },
  {
    "id": "sofa",
    "label": "Sofa",
    "file": "sofa_base.svg",
    "front": "sofa_front.svg",
    "width": 4,
    "height": 2.9,
    "pivotY": 0.7375,
    "group": "Home & Living",
    "collision": true
  },
  {
    "id": "storage",
    "label": "Storage",
    "file": "storage_base.svg",
    "front": null,
    "width": 2.4,
    "height": 3,
    "pivotY": 0.79,
    "group": "Home & Living",
    "collision": true
  },
  {
    "id": "street_props",
    "label": "Street Props",
    "file": "street_props_base.svg",
    "front": null,
    "width": 2.8,
    "height": 3.4,
    "pivotY": 0.79,
    "group": "Street / Park",
    "collision": true
  },
  {
    "id": "coffee",
    "label": "Coffee Station",
    "file": "coffee_base.svg",
    "front": null,
    "width": 2,
    "height": 2.7,
    "pivotY": 0.79,
    "group": "Home & Living",
    "collision": true
  },
  {
    "id": "warteg_buffet",
    "label": "Warteg Buffet",
    "file": "warteg_buffet_base.svg",
    "front": "warteg_buffet_front.svg",
    "width": 6,
    "height": 3.5,
    "pivotY": 0.7375,
    "group": "Warteg",
    "collision": true
  },
  {
    "id": "warteg_house",
    "label": "Warteg House",
    "file": "warteg_house_base.svg",
    "front": null,
    "width": 6.5,
    "height": 5.6,
    "pivotY": 0.79,
    "group": "Warteg",
    "collision": true
  },
  {
    "id": "warteg_sign",
    "label": "Warteg Sign",
    "file": "warteg_sign_base.svg",
    "front": null,
    "width": 3,
    "height": 1.6,
    "pivotY": 0.79,
    "group": "Warteg",
    "collision": false
  },
  {
    "id": "warteg_table",
    "label": "Warteg Table",
    "file": "warteg_table_base.svg",
    "front": null,
    "width": 4.5,
    "height": 2.8,
    "pivotY": 0.79,
    "group": "Warteg",
    "collision": true
  }
].map(e=>Object.freeze(e)));
