library("sf")
library("tidyverse")
library("geojsonsf")
library("leaflet")

filename  <- "~/klgbe/Geodaten/Sozialraeume_2017"
sfdt <- read_sf(paste0(filename,".shp")) %>% st_transform(.,"+proj=longlat +datum=WGS84")

# Test GGPLOT
sfdt %>% ggplot() + geom_sf() + theme_minimal()

# Test LEaflet
leaflet(sfdt) %>%   addPolygons(label = "a")

# Export
geojson <- sfdt   %>% sf_geojson(.,digits = 2)
write_lines(geojson,paste0(filename,".geojson"))
