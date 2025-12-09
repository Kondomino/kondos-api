
Now let's extract this page infos, in a way that:

# Medias
- We have the medias extracted, as simple urls of the files, e.g:
https://abiaengenharia.com.br/wp-content/uploads/2025/05/23043_ABIA_Cecy_01_FachadaDiurna_R01_alta-scaled.jpg

- No need to map page/stylish images/icons, or medias unrelated to the property/condominium.

# Data

- We want only data relevant to our Condominium properties. Please read our props (including the Kondo's relations), beforehand, to know what is relevant:

/src/kondo/entities/ ls:
-rw-r--r-- 1 kzz kzz   203 Nov 24 09:26 kondo.address.abstract.entity.ts
-rw-r--r-- 1 kzz kzz  2265 Nov 24 09:26 kondo.conveniences.abstract.entity.ts
-rw-r--r-- 1 kzz kzz  1437 Nov 24 09:26 kondo.details.abstract.entity.ts
-rw-r--r-- 1 kzz kzz 11175 Dec  8 10:06 kondo.entity.ts

# Output
Output the scraping results to a json file, at:

/src/references/scraping/outputs/

