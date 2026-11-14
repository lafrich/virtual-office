/* NJH interior PREVIEW only: draw Ellen's redrawn I1–I6 furniture
 * sprites in place of Bangun Ruang's procedural art. Activated only when
 * the URL has njhPreview or njhFurniturePreview=1, or when
 * window.VL_NJH_FURNITURE_PREVIEW === true. Live Bangun Ruang is unchanged.
 *
 * The catalog is keyed by assetId so a later 1x1 blocking type such as
 * sekat_wc can be added by dropping PNGs and a catalog entry — no
 * renderer change is required.
 */
(function(g){
'use strict';
const DIR=['sw','se','ne','nw'];
const CATALOG={"chair":{"se":{"file":"furniture-chair_se.png","size":[69,67],"pivot":[34,46],"footprint":[1,1]},"sw":{"file":"furniture-chair_sw.png","size":[69,76],"pivot":[34,55],"footprint":[1,1]},"ne":{"file":"furniture-chair_ne.png","size":[69,67],"pivot":[34,46],"footprint":[1,1]},"nw":{"file":"furniture-chair_nw.png","size":[69,76],"pivot":[34,55],"footprint":[1,1]}},"office_chair":{"se":{"file":"furniture-office_chair_se.png","size":[69,67],"pivot":[34,46],"footprint":[1,1]},"sw":{"file":"furniture-office_chair_sw.png","size":[69,76],"pivot":[34,55],"footprint":[1,1]},"ne":{"file":"furniture-office_chair_ne.png","size":[69,67],"pivot":[34,46],"footprint":[1,1]},"nw":{"file":"furniture-office_chair_nw.png","size":[69,76],"pivot":[34,55],"footprint":[1,1]}},"sofa":{"se":{"file":"furniture-sofa_se.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"sw":{"file":"furniture-sofa_sw.png","size":[101,93],"pivot":[50,64],"footprint":[2,1]},"ne":{"file":"furniture-sofa_ne.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"nw":{"file":"furniture-sofa_nw.png","size":[101,93],"pivot":[50,64],"footprint":[2,1]}},"table":{"se":{"file":"furniture-table_se.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"sw":{"file":"furniture-table_sw.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"ne":{"file":"furniture-table_ne.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"nw":{"file":"furniture-table_nw.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]}},"desk":{"se":{"file":"furniture-desk_se.png","size":[101,88],"pivot":[50,59],"footprint":[2,1]},"sw":{"file":"furniture-desk_sw.png","size":[101,94],"pivot":[50,65],"footprint":[2,1]},"ne":{"file":"furniture-desk_ne.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"nw":{"file":"furniture-desk_nw.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]}},"bed":{"se":{"file":"furniture-bed_se.png","size":[133,89],"pivot":[66,52],"footprint":[2,2]},"sw":{"file":"furniture-bed_sw.png","size":[133,103],"pivot":[66,66],"footprint":[2,2]},"ne":{"file":"furniture-bed_ne.png","size":[133,89],"pivot":[66,52],"footprint":[2,2]},"nw":{"file":"furniture-bed_nw.png","size":[133,103],"pivot":[66,66],"footprint":[2,2]}},"wardrobe":{"se":{"file":"furniture-wardrobe_se.png","size":[101,107],"pivot":[50,78],"footprint":[2,1]},"sw":{"file":"furniture-wardrobe_sw.png","size":[101,107],"pivot":[50,78],"footprint":[2,1]},"ne":{"file":"furniture-wardrobe_ne.png","size":[101,107],"pivot":[50,78],"footprint":[2,1]},"nw":{"file":"furniture-wardrobe_nw.png","size":[101,107],"pivot":[50,78],"footprint":[2,1]}},"shelf":{"se":{"file":"furniture-shelf_se.png","size":[101,103],"pivot":[50,74],"footprint":[2,1]},"sw":{"file":"furniture-shelf_sw.png","size":[101,102],"pivot":[50,73],"footprint":[2,1]},"ne":{"file":"furniture-shelf_ne.png","size":[101,103],"pivot":[50,74],"footprint":[2,1]},"nw":{"file":"furniture-shelf_nw.png","size":[101,102],"pivot":[50,73],"footprint":[2,1]}},"fridge":{"se":{"file":"furniture-fridge_se.png","size":[69,93],"pivot":[34,72],"footprint":[1,1]},"sw":{"file":"furniture-fridge_sw.png","size":[69,93],"pivot":[34,72],"footprint":[1,1]},"ne":{"file":"furniture-fridge_ne.png","size":[69,93],"pivot":[34,72],"footprint":[1,1]},"nw":{"file":"furniture-fridge_nw.png","size":[69,93],"pivot":[34,72],"footprint":[1,1]}},"stove":{"se":{"file":"furniture-stove_se.png","size":[69,67],"pivot":[34,46],"footprint":[1,1]},"sw":{"file":"furniture-stove_sw.png","size":[69,67],"pivot":[34,46],"footprint":[1,1]},"ne":{"file":"furniture-stove_ne.png","size":[69,67],"pivot":[34,46],"footprint":[1,1]},"nw":{"file":"furniture-stove_nw.png","size":[69,67],"pivot":[34,46],"footprint":[1,1]}},"bathtub":{"se":{"file":"furniture-bathtub_se.png","size":[101,74],"pivot":[50,45],"footprint":[2,1]},"sw":{"file":"furniture-bathtub_sw.png","size":[101,78],"pivot":[50,49],"footprint":[2,1]},"ne":{"file":"furniture-bathtub_ne.png","size":[101,74],"pivot":[50,45],"footprint":[2,1]},"nw":{"file":"furniture-bathtub_nw.png","size":[101,74],"pivot":[50,45],"footprint":[2,1]}},"wc":{"se":{"file":"furniture-wc_se.png","size":[69,66],"pivot":[34,45],"footprint":[1,1]},"sw":{"file":"furniture-wc_sw.png","size":[69,77],"pivot":[34,56],"footprint":[1,1]},"ne":{"file":"furniture-wc_ne.png","size":[69,66],"pivot":[34,45],"footprint":[1,1]},"nw":{"file":"furniture-wc_nw.png","size":[69,77],"pivot":[34,56],"footprint":[1,1]}},"shower":{"se":{"file":"furniture-shower_se.png","size":[69,84],"pivot":[34,63],"footprint":[1,1]},"sw":{"file":"furniture-shower_sw.png","size":[69,84],"pivot":[34,63],"footprint":[1,1]},"ne":{"file":"furniture-shower_ne.png","size":[69,72],"pivot":[34,51],"footprint":[1,1]},"nw":{"file":"furniture-shower_nw.png","size":[69,83],"pivot":[34,62],"footprint":[1,1]}},"sink":{"se":{"file":"furniture-sink_se.png","size":[69,64],"pivot":[34,43],"footprint":[1,1]},"sw":{"file":"furniture-sink_sw.png","size":[69,69],"pivot":[34,48],"footprint":[1,1]},"ne":{"file":"furniture-sink_ne.png","size":[69,64],"pivot":[34,43],"footprint":[1,1]},"nw":{"file":"furniture-sink_nw.png","size":[69,68],"pivot":[34,47],"footprint":[1,1]}},"kitchen_sink":{"se":{"file":"furniture-kitchen_sink_se.png","size":[69,64],"pivot":[34,43],"footprint":[1,1]},"sw":{"file":"furniture-kitchen_sink_sw.png","size":[69,69],"pivot":[34,48],"footprint":[1,1]},"ne":{"file":"furniture-kitchen_sink_ne.png","size":[69,64],"pivot":[34,43],"footprint":[1,1]},"nw":{"file":"furniture-kitchen_sink_nw.png","size":[69,68],"pivot":[34,47],"footprint":[1,1]}},"computer":{"se":{"file":"furniture-computer_se.png","size":[69,69],"pivot":[34,48],"footprint":[1,1]},"sw":{"file":"furniture-computer_sw.png","size":[69,79],"pivot":[34,58],"footprint":[1,1]},"ne":{"file":"furniture-computer_ne.png","size":[69,69],"pivot":[34,48],"footprint":[1,1]},"nw":{"file":"furniture-computer_nw.png","size":[69,79],"pivot":[34,58],"footprint":[1,1]}},"cashier":{"se":{"file":"furniture-cashier_se.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"sw":{"file":"furniture-cashier_sw.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"ne":{"file":"furniture-cashier_ne.png","size":[101,87],"pivot":[50,58],"footprint":[2,1]},"nw":{"file":"furniture-cashier_nw.png","size":[101,90],"pivot":[50,61],"footprint":[2,1]}},"counter":{"se":{"file":"furniture-counter_se.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"sw":{"file":"furniture-counter_sw.png","size":[101,85],"pivot":[50,56],"footprint":[2,1]},"ne":{"file":"furniture-counter_ne.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"nw":{"file":"furniture-counter_nw.png","size":[101,85],"pivot":[50,56],"footprint":[2,1]}},"dining_table":{"se":{"file":"furniture-dining_table_se.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"sw":{"file":"furniture-dining_table_sw.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"ne":{"file":"furniture-dining_table_ne.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"nw":{"file":"furniture-dining_table_nw.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]}},"wooden_bench":{"se":{"file":"furniture-wooden_bench_se.png","size":[101,80],"pivot":[50,51],"footprint":[2,1]},"sw":{"file":"furniture-wooden_bench_sw.png","size":[101,90],"pivot":[50,61],"footprint":[2,1]},"ne":{"file":"furniture-wooden_bench_ne.png","size":[101,80],"pivot":[50,51],"footprint":[2,1]},"nw":{"file":"furniture-wooden_bench_nw.png","size":[101,90],"pivot":[50,61],"footprint":[2,1]}},"tv":{"se":{"file":"furniture-tv_se.png","size":[101,111],"pivot":[50,82],"footprint":[2,1]},"sw":{"file":"furniture-tv_sw.png","size":[101,118],"pivot":[50,89],"footprint":[2,1]},"ne":{"file":"furniture-tv_ne.png","size":[101,111],"pivot":[50,82],"footprint":[2,1]},"nw":{"file":"furniture-tv_nw.png","size":[101,118],"pivot":[50,89],"footprint":[2,1]}},"fan":{"se":{"file":"furniture-fan_se.png","size":[69,75],"pivot":[34,54],"footprint":[1,1]},"sw":{"file":"furniture-fan_sw.png","size":[69,78],"pivot":[34,57],"footprint":[1,1]},"ne":{"file":"furniture-fan_ne.png","size":[69,75],"pivot":[34,54],"footprint":[1,1]},"nw":{"file":"furniture-fan_nw.png","size":[69,78],"pivot":[34,57],"footprint":[1,1]}},"shoe_rack":{"se":{"file":"furniture-shoe_rack_se.png","size":[101,103],"pivot":[50,74],"footprint":[2,1]},"sw":{"file":"furniture-shoe_rack_sw.png","size":[101,102],"pivot":[50,73],"footprint":[2,1]},"ne":{"file":"furniture-shoe_rack_ne.png","size":[101,103],"pivot":[50,74],"footprint":[2,1]},"nw":{"file":"furniture-shoe_rack_nw.png","size":[101,102],"pivot":[50,73],"footprint":[2,1]}},"bookshelf":{"se":{"file":"furniture-bookshelf_se.png","size":[101,103],"pivot":[50,74],"footprint":[2,1]},"sw":{"file":"furniture-bookshelf_sw.png","size":[101,102],"pivot":[50,73],"footprint":[2,1]},"ne":{"file":"furniture-bookshelf_ne.png","size":[101,103],"pivot":[50,74],"footprint":[2,1]},"nw":{"file":"furniture-bookshelf_nw.png","size":[101,102],"pivot":[50,73],"footprint":[2,1]}},"study_desk":{"se":{"file":"furniture-study_desk_se.png","size":[101,88],"pivot":[50,59],"footprint":[2,1]},"sw":{"file":"furniture-study_desk_sw.png","size":[101,94],"pivot":[50,65],"footprint":[2,1]},"ne":{"file":"furniture-study_desk_ne.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"nw":{"file":"furniture-study_desk_nw.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]}},"locker":{"se":{"file":"furniture-locker_se.png","size":[101,107],"pivot":[50,78],"footprint":[2,1]},"sw":{"file":"furniture-locker_sw.png","size":[101,107],"pivot":[50,78],"footprint":[2,1]},"ne":{"file":"furniture-locker_ne.png","size":[101,107],"pivot":[50,78],"footprint":[2,1]},"nw":{"file":"furniture-locker_nw.png","size":[101,107],"pivot":[50,78],"footprint":[2,1]}},"washing_machine":{"se":{"file":"furniture-washing_machine_se.png","size":[69,78],"pivot":[34,57],"footprint":[1,1]},"sw":{"file":"furniture-washing_machine_sw.png","size":[69,78],"pivot":[34,57],"footprint":[1,1]},"ne":{"file":"furniture-washing_machine_ne.png","size":[69,78],"pivot":[34,57],"footprint":[1,1]},"nw":{"file":"furniture-washing_machine_nw.png","size":[69,78],"pivot":[34,57],"footprint":[1,1]}},"water_dispenser":{"se":{"file":"furniture-water_dispenser_se.png","size":[69,91],"pivot":[34,70],"footprint":[1,1]},"sw":{"file":"furniture-water_dispenser_sw.png","size":[69,89],"pivot":[34,68],"footprint":[1,1]},"ne":{"file":"furniture-water_dispenser_ne.png","size":[69,91],"pivot":[34,70],"footprint":[1,1]},"nw":{"file":"furniture-water_dispenser_nw.png","size":[69,89],"pivot":[34,68],"footprint":[1,1]}},"floor_mattress":{"se":{"file":"furniture-floor_mattress_se.png","size":[133,77],"pivot":[66,40],"footprint":[2,2]},"sw":{"file":"furniture-floor_mattress_sw.png","size":[133,77],"pivot":[66,40],"footprint":[2,2]},"ne":{"file":"furniture-floor_mattress_ne.png","size":[133,77],"pivot":[66,40],"footprint":[2,2]},"nw":{"file":"furniture-floor_mattress_nw.png","size":[133,77],"pivot":[66,40],"footprint":[2,2]}},"prayer_mat":{"se":{"file":"furniture-prayer_mat_se.png","size":[101,56],"pivot":[50,27],"footprint":[1,2]},"sw":{"file":"furniture-prayer_mat_sw.png","size":[101,56],"pivot":[50,27],"footprint":[1,2]},"ne":{"file":"furniture-prayer_mat_ne.png","size":[101,56],"pivot":[50,27],"footprint":[1,2]},"nw":{"file":"furniture-prayer_mat_nw.png","size":[101,56],"pivot":[50,27],"footprint":[1,2]}},"rice_cooker":{"se":{"file":"furniture-rice_cooker_se.png","size":[69,75],"pivot":[34,54],"footprint":[1,1]},"sw":{"file":"furniture-rice_cooker_sw.png","size":[69,75],"pivot":[34,54],"footprint":[1,1]},"ne":{"file":"furniture-rice_cooker_ne.png","size":[69,75],"pivot":[34,54],"footprint":[1,1]},"nw":{"file":"furniture-rice_cooker_nw.png","size":[69,75],"pivot":[34,54],"footprint":[1,1]}},"dish_rack":{"se":{"file":"furniture-dish_rack_se.png","size":[101,103],"pivot":[50,74],"footprint":[2,1]},"sw":{"file":"furniture-dish_rack_sw.png","size":[101,102],"pivot":[50,73],"footprint":[2,1]},"ne":{"file":"furniture-dish_rack_ne.png","size":[101,103],"pivot":[50,74],"footprint":[2,1]},"nw":{"file":"furniture-dish_rack_nw.png","size":[101,102],"pivot":[50,73],"footprint":[2,1]}},"drink_cooler":{"se":{"file":"furniture-drink_cooler_se.png","size":[69,93],"pivot":[34,72],"footprint":[1,1]},"sw":{"file":"furniture-drink_cooler_sw.png","size":[69,93],"pivot":[34,72],"footprint":[1,1]},"ne":{"file":"furniture-drink_cooler_ne.png","size":[69,93],"pivot":[34,72],"footprint":[1,1]},"nw":{"file":"furniture-drink_cooler_nw.png","size":[69,93],"pivot":[34,72],"footprint":[1,1]}},"fridge_drinks":{"se":{"file":"furniture-fridge_drinks_se.png","size":[69,93],"pivot":[34,72],"footprint":[1,1]},"sw":{"file":"furniture-fridge_drinks_sw.png","size":[69,93],"pivot":[34,72],"footprint":[1,1]},"ne":{"file":"furniture-fridge_drinks_ne.png","size":[69,93],"pivot":[34,72],"footprint":[1,1]},"nw":{"file":"furniture-fridge_drinks_nw.png","size":[69,93],"pivot":[34,72],"footprint":[1,1]}},"aisle_rack":{"se":{"file":"furniture-aisle_rack_se.png","size":[101,107],"pivot":[50,78],"footprint":[2,1]},"sw":{"file":"furniture-aisle_rack_sw.png","size":[101,107],"pivot":[50,78],"footprint":[2,1]},"ne":{"file":"furniture-aisle_rack_ne.png","size":[101,107],"pivot":[50,78],"footprint":[2,1]},"nw":{"file":"furniture-aisle_rack_nw.png","size":[101,107],"pivot":[50,78],"footprint":[2,1]}},"checkout":{"se":{"file":"furniture-checkout_se.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"sw":{"file":"furniture-checkout_sw.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"ne":{"file":"furniture-checkout_ne.png","size":[101,87],"pivot":[50,58],"footprint":[2,1]},"nw":{"file":"furniture-checkout_nw.png","size":[101,90],"pivot":[50,61],"footprint":[2,1]}},"waiting_bench":{"se":{"file":"furniture-waiting_bench_se.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"sw":{"file":"furniture-waiting_bench_sw.png","size":[101,93],"pivot":[50,64],"footprint":[2,1]},"ne":{"file":"furniture-waiting_bench_ne.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"nw":{"file":"furniture-waiting_bench_nw.png","size":[101,93],"pivot":[50,64],"footprint":[2,1]}},"whiteboard":{"se":{"file":"furniture-whiteboard_se.png","size":[101,127],"pivot":[50,98],"footprint":[2,1]},"sw":{"file":"furniture-whiteboard_sw.png","size":[101,140],"pivot":[50,111],"footprint":[2,1]},"ne":{"file":"furniture-whiteboard_ne.png","size":[101,127],"pivot":[50,98],"footprint":[2,1]},"nw":{"file":"furniture-whiteboard_nw.png","size":[101,140],"pivot":[50,111],"footprint":[2,1]}},"food_vitrine":{"se":{"file":"furniture-food_vitrine_se.png","size":[101,110],"pivot":[50,81],"footprint":[2,1]},"sw":{"file":"furniture-food_vitrine_sw.png","size":[101,110],"pivot":[50,81],"footprint":[2,1]},"ne":{"file":"furniture-food_vitrine_ne.png","size":[101,110],"pivot":[50,81],"footprint":[2,1]},"nw":{"file":"furniture-food_vitrine_nw.png","size":[101,110],"pivot":[50,81],"footprint":[2,1]}},"food_cart":{"se":{"file":"furniture-food_cart_se.png","size":[101,104],"pivot":[50,75],"footprint":[2,1]},"sw":{"file":"furniture-food_cart_sw.png","size":[101,116],"pivot":[50,87],"footprint":[2,1]},"ne":{"file":"furniture-food_cart_ne.png","size":[101,104],"pivot":[50,75],"footprint":[2,1]},"nw":{"file":"furniture-food_cart_nw.png","size":[101,116],"pivot":[50,87],"footprint":[2,1]}},"noodle_pot":{"se":{"file":"furniture-noodle_pot_se.png","size":[69,75],"pivot":[34,54],"footprint":[1,1]},"sw":{"file":"furniture-noodle_pot_sw.png","size":[69,75],"pivot":[34,54],"footprint":[1,1]},"ne":{"file":"furniture-noodle_pot_ne.png","size":[69,75],"pivot":[34,54],"footprint":[1,1]},"nw":{"file":"furniture-noodle_pot_nw.png","size":[69,75],"pivot":[34,54],"footprint":[1,1]}},"coffee_machine":{"se":{"file":"furniture-coffee_machine_se.png","size":[69,82],"pivot":[34,61],"footprint":[1,1]},"sw":{"file":"furniture-coffee_machine_sw.png","size":[69,87],"pivot":[34,66],"footprint":[1,1]},"ne":{"file":"furniture-coffee_machine_ne.png","size":[69,82],"pivot":[34,61],"footprint":[1,1]},"nw":{"file":"furniture-coffee_machine_nw.png","size":[69,87],"pivot":[34,66],"footprint":[1,1]}},"display_freezer":{"se":{"file":"furniture-display_freezer_se.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"sw":{"file":"furniture-display_freezer_sw.png","size":[101,85],"pivot":[50,56],"footprint":[2,1]},"ne":{"file":"furniture-display_freezer_ne.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"nw":{"file":"furniture-display_freezer_nw.png","size":[101,85],"pivot":[50,56],"footprint":[2,1]}},"market_crate":{"se":{"file":"furniture-market_crate_se.png","size":[69,62],"pivot":[34,41],"footprint":[1,1]},"sw":{"file":"furniture-market_crate_sw.png","size":[69,61],"pivot":[34,40],"footprint":[1,1]},"ne":{"file":"furniture-market_crate_ne.png","size":[69,62],"pivot":[34,41],"footprint":[1,1]},"nw":{"file":"furniture-market_crate_nw.png","size":[69,61],"pivot":[34,40],"footprint":[1,1]}},"atm":{"se":{"file":"furniture-atm_se.png","size":[69,99],"pivot":[34,78],"footprint":[1,1]},"sw":{"file":"furniture-atm_sw.png","size":[69,99],"pivot":[34,78],"footprint":[1,1]},"ne":{"file":"furniture-atm_ne.png","size":[69,99],"pivot":[34,78],"footprint":[1,1]},"nw":{"file":"furniture-atm_nw.png","size":[69,99],"pivot":[34,78],"footprint":[1,1]}},"registration_desk":{"se":{"file":"furniture-registration_desk_se.png","size":[101,88],"pivot":[50,59],"footprint":[2,1]},"sw":{"file":"furniture-registration_desk_sw.png","size":[101,94],"pivot":[50,65],"footprint":[2,1]},"ne":{"file":"furniture-registration_desk_ne.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"nw":{"file":"furniture-registration_desk_nw.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]}},"clinic_bed":{"se":{"file":"furniture-clinic_bed_se.png","size":[133,89],"pivot":[66,52],"footprint":[2,2]},"sw":{"file":"furniture-clinic_bed_sw.png","size":[133,103],"pivot":[66,66],"footprint":[2,2]},"ne":{"file":"furniture-clinic_bed_ne.png","size":[133,89],"pivot":[66,52],"footprint":[2,2]},"nw":{"file":"furniture-clinic_bed_nw.png","size":[133,103],"pivot":[66,66],"footprint":[2,2]}},"medicine_rack":{"se":{"file":"furniture-medicine_rack_se.png","size":[101,103],"pivot":[50,74],"footprint":[2,1]},"sw":{"file":"furniture-medicine_rack_sw.png","size":[101,102],"pivot":[50,73],"footprint":[2,1]},"ne":{"file":"furniture-medicine_rack_ne.png","size":[101,103],"pivot":[50,74],"footprint":[2,1]},"nw":{"file":"furniture-medicine_rack_nw.png","size":[101,102],"pivot":[50,73],"footprint":[2,1]}},"squat_toilet":{"se":{"file":"furniture-squat_toilet_se.png","size":[69,41],"pivot":[34,20],"footprint":[1,1]},"sw":{"file":"furniture-squat_toilet_sw.png","size":[69,42],"pivot":[34,21],"footprint":[1,1]},"ne":{"file":"furniture-squat_toilet_ne.png","size":[69,41],"pivot":[34,20],"footprint":[1,1]},"nw":{"file":"furniture-squat_toilet_nw.png","size":[69,42],"pivot":[34,21],"footprint":[1,1]}},"water_tub":{"se":{"file":"furniture-water_tub_se.png","size":[69,67],"pivot":[34,46],"footprint":[1,1]},"sw":{"file":"furniture-water_tub_sw.png","size":[69,67],"pivot":[34,46],"footprint":[1,1]},"ne":{"file":"furniture-water_tub_ne.png","size":[69,67],"pivot":[34,46],"footprint":[1,1]},"nw":{"file":"furniture-water_tub_nw.png","size":[69,67],"pivot":[34,46],"footprint":[1,1]}},"wudhu_tap":{"se":{"file":"furniture-wudhu_tap_se.png","size":[69,64],"pivot":[34,43],"footprint":[1,1]},"sw":{"file":"furniture-wudhu_tap_sw.png","size":[69,69],"pivot":[34,48],"footprint":[1,1]},"ne":{"file":"furniture-wudhu_tap_ne.png","size":[69,64],"pivot":[34,43],"footprint":[1,1]},"nw":{"file":"furniture-wudhu_tap_nw.png","size":[69,68],"pivot":[34,47],"footprint":[1,1]}},"arcade":{"se":{"file":"furniture-arcade_se.png","size":[69,101],"pivot":[34,80],"footprint":[1,1]},"sw":{"file":"furniture-arcade_sw.png","size":[69,101],"pivot":[34,80],"footprint":[1,1]},"ne":{"file":"furniture-arcade_ne.png","size":[69,101],"pivot":[34,80],"footprint":[1,1]},"nw":{"file":"furniture-arcade_nw.png","size":[69,101],"pivot":[34,80],"footprint":[1,1]}},"game_console":{"se":{"file":"furniture-game_console_se.png","size":[101,111],"pivot":[50,82],"footprint":[2,1]},"sw":{"file":"furniture-game_console_sw.png","size":[101,118],"pivot":[50,89],"footprint":[2,1]},"ne":{"file":"furniture-game_console_ne.png","size":[101,111],"pivot":[50,82],"footprint":[2,1]},"nw":{"file":"furniture-game_console_nw.png","size":[101,118],"pivot":[50,89],"footprint":[2,1]}},"salon_chair":{"se":{"file":"furniture-salon_chair_se.png","size":[69,67],"pivot":[34,46],"footprint":[1,1]},"sw":{"file":"furniture-salon_chair_sw.png","size":[69,76],"pivot":[34,55],"footprint":[1,1]},"ne":{"file":"furniture-salon_chair_ne.png","size":[69,67],"pivot":[34,46],"footprint":[1,1]},"nw":{"file":"furniture-salon_chair_nw.png","size":[69,76],"pivot":[34,55],"footprint":[1,1]}},"salon_mirror":{"se":{"file":"furniture-salon_mirror_se.png","size":[69,111],"pivot":[34,90],"footprint":[1,1]},"sw":{"file":"furniture-salon_mirror_sw.png","size":[69,124],"pivot":[34,103],"footprint":[1,1]},"ne":{"file":"furniture-salon_mirror_ne.png","size":[69,111],"pivot":[34,90],"footprint":[1,1]},"nw":{"file":"furniture-salon_mirror_nw.png","size":[69,124],"pivot":[34,103],"footprint":[1,1]}},"laundry_counter":{"se":{"file":"furniture-laundry_counter_se.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"sw":{"file":"furniture-laundry_counter_sw.png","size":[101,85],"pivot":[50,56],"footprint":[2,1]},"ne":{"file":"furniture-laundry_counter_ne.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"nw":{"file":"furniture-laundry_counter_nw.png","size":[101,85],"pivot":[50,56],"footprint":[2,1]}},"workbench":{"se":{"file":"furniture-workbench_se.png","size":[101,88],"pivot":[50,59],"footprint":[2,1]},"sw":{"file":"furniture-workbench_sw.png","size":[101,94],"pivot":[50,65],"footprint":[2,1]},"ne":{"file":"furniture-workbench_ne.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]},"nw":{"file":"furniture-workbench_nw.png","size":[101,83],"pivot":[50,54],"footprint":[2,1]}},"tool_rack":{"se":{"file":"furniture-tool_rack_se.png","size":[101,103],"pivot":[50,74],"footprint":[2,1]},"sw":{"file":"furniture-tool_rack_sw.png","size":[101,102],"pivot":[50,73],"footprint":[2,1]},"ne":{"file":"furniture-tool_rack_ne.png","size":[101,103],"pivot":[50,74],"footprint":[2,1]},"nw":{"file":"furniture-tool_rack_nw.png","size":[101,102],"pivot":[50,73],"footprint":[2,1]}},"gym_mat":{"se":{"file":"furniture-gym_mat_se.png","size":[101,56],"pivot":[50,27],"footprint":[1,2]},"sw":{"file":"furniture-gym_mat_sw.png","size":[101,56],"pivot":[50,27],"footprint":[1,2]},"ne":{"file":"furniture-gym_mat_ne.png","size":[101,56],"pivot":[50,27],"footprint":[1,2]},"nw":{"file":"furniture-gym_mat_nw.png","size":[101,56],"pivot":[50,27],"footprint":[1,2]}},"treadmill":{"se":{"file":"furniture-treadmill_se.png","size":[101,63],"pivot":[50,34],"footprint":[2,1]},"sw":{"file":"furniture-treadmill_sw.png","size":[101,63],"pivot":[50,34],"footprint":[2,1]},"ne":{"file":"furniture-treadmill_ne.png","size":[101,63],"pivot":[50,34],"footprint":[2,1]},"nw":{"file":"furniture-treadmill_nw.png","size":[101,63],"pivot":[50,34],"footprint":[2,1]}},"trash_bin":{"se":{"file":"furniture-trash_bin_se.png","size":[69,61],"pivot":[34,40],"footprint":[1,1]},"sw":{"file":"furniture-trash_bin_sw.png","size":[69,60],"pivot":[34,39],"footprint":[1,1]},"ne":{"file":"furniture-trash_bin_ne.png","size":[69,61],"pivot":[34,40],"footprint":[1,1]},"nw":{"file":"furniture-trash_bin_nw.png","size":[69,60],"pivot":[34,39],"footprint":[1,1]}},"sekat_wc":{"sw":{"file":"furniture-sekat_wc_sw.png","size":[69,92],"pivot":[34,71],"footprint":[1,1]},"se":{"file":"furniture-sekat_wc_se.png","size":[69,92],"pivot":[34,71],"footprint":[1,1]},"ne":{"file":"furniture-sekat_wc_ne.png","size":[69,92],"pivot":[34,71],"footprint":[1,1]},"nw":{"file":"furniture-sekat_wc_nw.png","size":[69,92],"pivot":[34,71],"footprint":[1,1]}}};
function baseUrl(){
 try{
  const scripts=g.document?.getElementsByTagName('script')||[];
  for(let i=scripts.length-1;i>=0;i--){
   const src=scripts[i].src||'';
   if(/njh-interior-art-preview\.js/.test(src))
    return src.replace(/njh-interior-art-preview\.js(?:\?.*)?$/,'njh-interior-preview-art/');
  }
 }catch(e){}
 return './njh-interior-preview-art/';
}
function enabled(){
 try{
  if(g.VL_NJH_FURNITURE_PREVIEW===true)return true;
  if(g.VL_NJH_FURNITURE_PREVIEW===false)return false;
  const p=new URLSearchParams(g.location?.search||'');
  return p.has('njhPreview')||p.get('njhFurniturePreview')==='1'||p.get('njhMap')==='1';
 }catch(e){return false;}
}
function dirFor(item){
 const iso=g.VLInteriorIso;
 const rot=iso?.fixtureRotation?iso.fixtureRotation(item):
  (Math.round((((Number(item?.rotation)||0)%360+360)%360)/90)%4);
 return DIR[rot]||'sw';
}
// Shared NJH Mart art is already in the playable interior pack. Reuse its
// metadata and four-view PNGs for Bangun Ruang preview instead of redrawing.
const MART_IDS=Object.freeze([
 'njh_rak_sembako','njh_rak_bumbu_mi','njh_rak_snack','njh_chiller_segar',
 'njh_display_sayur_buah','njh_keranjang_belanja','njh_troli',
 'njh_papan_promo','njh_counter_kasir','njh_counter_kopi','njh_mesin_kopi'
]);
let martKitStatus='unrequested',martKitError=null,martKitPromise=null;
function martKitBase(){
 return new URL('../../njh-play-interiors/',new URL(baseUrl(),g.location?.href||document.baseURI)).href;
}
function loadMartKit(){
 if(martKitPromise||!enabled())return martKitPromise;
 martKitStatus='loading';
 const base=martKitBase();
 martKitPromise=fetch(base+'catalog.json',{cache:'no-cache'})
  .then(r=>{if(!r.ok)throw Error('NJH Mart catalog HTTP '+r.status);return r.json();})
  .then(data=>{
   const items=data?.items||{};
   for(const id of MART_IDS){
    const row=items[id];
    if(!row||DIR.some(d=>!row[d]?.file||!Array.isArray(row[d].footprint)))
     throw Error('NJH Mart missing four-view source '+id);
   }
   for(const id of MART_IDS){
    CATALOG[id]=Object.fromEntries(DIR.map(d=>[d,{...items[id][d],sourceBase:base}]));
    if(preloaded)for(const d of DIR){total++;load(base+CATALOG[id][d].file);}
   }
   martKitStatus='ready';
  })
  .catch(err=>{martKitStatus='error';martKitError=String(err.message||err);console.warn('NJH Mart art preview unavailable',err);})
  .finally(notify);
 return martKitPromise;
}
const imageCache=new Map();
let loaded=0,failed=0,total=0,preloaded=false,notifyScheduled=false;
function notify(){
 if(notifyScheduled)return;
 notifyScheduled=true;
 const fire=()=>{
  notifyScheduled=false;
  try{g.dispatchEvent(new Event('semesta:furniture-ready'));}catch(e){}
 };
 if(typeof g.requestAnimationFrame==='function')g.requestAnimationFrame(fire);
 else setTimeout(fire,0);
}
function load(url){
 let state=imageCache.get(url);
 if(state)return state;
 state={img:null,ready:false,error:false};
 imageCache.set(url,state);
 if(typeof Image==='undefined'){state.error=true;failed++;return state;}
 const img=new Image();
 state.img=img;
 img.onload=()=>{state.ready=true;loaded++;notify();};
 img.onerror=()=>{state.error=true;failed++;notify();};
 img.src=url;
 return state;
}
function viewOf(assetId,dir){
 const row=CATALOG[assetId];
 if(!row)return null;
 const v=row[dir]||row.sw||row.se;
 if(!v)return null;
 return {url:(v.sourceBase||baseUrl())+v.file,size:v.size,pivot:v.pivot,footprint:v.footprint};
}
function get(assetId){
 if(!enabled())return null;
 const row=CATALOG[assetId];
 if(!row)return null;
 const views={};
 for(const d of DIR){
  const v=viewOf(assetId,d);
  if(v){load(v.url);views[d]=v;}
 }
 return {id:assetId,views};
}
function owns(assetId){
 return enabled()&&!!CATALOG[assetId];
}
function preload(){
 if(preloaded||!enabled())return;
 preloaded=true;
 total=0;
 loadMartKit();
 const base=baseUrl();
 for(const row of Object.values(CATALOG)){
  for(const d of DIR){
   if(!row[d])continue;
   total++;
   load((row[d].sourceBase||base)+row[d].file);
  }
 }
}
function ready(){
 if(!enabled())return true;
 if(!preloaded)preload();
 return martKitStatus!=='loading'&&loaded+failed>=total;
}
function whenReady(){
 return new Promise(resolve=>{
  if(ready()){resolve();return;}
  const tick=()=>{if(ready())resolve();else setTimeout(tick,40);};
  tick();
 });
}
function status(){
 return {enabled:enabled(),loaded,failed,total,ready:ready(),types:Object.keys(CATALOG).length,martKitStatus,martKitError};
}
function drawPlan(ctx,item,x,y,w,h){
 if(!enabled()||!item||!ctx)return false;
 const row=get(item.assetId);
 if(!row)return false;
 const dir=dirFor(item);
 const view=row.views[dir]||row.views.sw;
 if(!view)return false;
 const state=load(view.url);
 if(!state.ready)return false;
 const width=Number(view.size?.[0])||state.img.naturalWidth;
 const height=Number(view.size?.[1])||state.img.naturalHeight;
 const scale=Math.min(w/Math.max(1,width),h/Math.max(1,height));
 const dw=width*scale,dh=height*scale;
 ctx.save();
 ctx.imageSmoothingEnabled=false;
 ctx.translate(x+w/2,y+h/2);
 if(item.flipX===true||item.flipY===true)
  ctx.scale(item.flipX===true?-1:1,item.flipY===true?-1:1);
 ctx.drawImage(state.img,-dw/2,-dh/2,dw,dh);
 ctx.restore();
 return true;
}
g.VLNjhInteriorArtPreview=Object.freeze({
 enabled,get,owns,dirFor,preload,ready,whenReady,status,drawPlan,DIR
});
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',preload);
 else preload();
}
})(typeof window!=='undefined'?window:globalThis);
