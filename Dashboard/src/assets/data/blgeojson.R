library("sf")
library("tidyverse")
library("geojsonsf")
library("leaflet")
bl <- read_sf("/Users/lekroll/Downloads/vg1000-ew_3112.gk3.shape.ebenen/vg1000-ew_ebenen_3112/VG1000_LAN.shp") %>% 
  select(Bundesland=GEN,EWZ) %>% filter(EWZ>0)  %>% st_transform(.,"+proj=longlat +datum=WGS84")

# Test GGPLOT
bl %>% ggplot() + geom_sf() + theme_minimal()

# Test LEaflet
leaflet(bl) %>%   addPolygons(color = "green")

# Export
geojson <- bl   %>% sf_geojson(.,digits = 2)
write_lines(geojson,"~/bl.geojson")
