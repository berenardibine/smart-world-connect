-- Create provinces table
CREATE TABLE public.provinces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create districts table
CREATE TABLE public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province_id UUID NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(province_id, name)
);

-- Create sectors table
CREATE TABLE public.sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(district_id, name)
);

-- Add location columns to profiles (nullable for backward compatibility)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS province_id UUID REFERENCES public.provinces(id),
ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES public.districts(id),
ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_districts_province ON public.districts(province_id);
CREATE INDEX IF NOT EXISTS idx_sectors_district ON public.sectors(district_id);
CREATE INDEX IF NOT EXISTS idx_profiles_province ON public.profiles(province_id);
CREATE INDEX IF NOT EXISTS idx_profiles_district ON public.profiles(district_id);
CREATE INDEX IF NOT EXISTS idx_profiles_sector ON public.profiles(sector_id);

-- Enable RLS
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Everyone can view locations
CREATE POLICY "Anyone can view provinces" ON public.provinces FOR SELECT USING (true);
CREATE POLICY "Anyone can view districts" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Anyone can view sectors" ON public.sectors FOR SELECT USING (true);

-- Only admins can manage locations
CREATE POLICY "Admins can manage provinces" ON public.provinces FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage districts" ON public.districts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage sectors" ON public.sectors FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert all provinces
INSERT INTO public.provinces (name) VALUES 
('City of Kigali'),
('Eastern Province'),
('Northern Province'),
('Southern Province'),
('Western Province');

-- Insert all districts with their provinces
-- City of Kigali
WITH kigali AS (SELECT id FROM public.provinces WHERE name = 'City of Kigali')
INSERT INTO public.districts (province_id, name) 
SELECT kigali.id, d.name FROM kigali, (VALUES ('Gasabo'), ('Kicukiro'), ('Nyarugenge')) AS d(name);

-- Eastern Province
WITH eastern AS (SELECT id FROM public.provinces WHERE name = 'Eastern Province')
INSERT INTO public.districts (province_id, name) 
SELECT eastern.id, d.name FROM eastern, (VALUES ('Bugesera'), ('Gatsibo'), ('Kayonza'), ('Kirehe'), ('Ngoma'), ('Nyagatare'), ('Rwamagana')) AS d(name);

-- Northern Province
WITH northern AS (SELECT id FROM public.provinces WHERE name = 'Northern Province')
INSERT INTO public.districts (province_id, name) 
SELECT northern.id, d.name FROM northern, (VALUES ('Burera'), ('Gakenke'), ('Gicumbi'), ('Musanze'), ('Rulindo')) AS d(name);

-- Southern Province
WITH southern AS (SELECT id FROM public.provinces WHERE name = 'Southern Province')
INSERT INTO public.districts (province_id, name) 
SELECT southern.id, d.name FROM southern, (VALUES ('Gisagara'), ('Huye'), ('Kamonyi'), ('Muhanga'), ('Nyamagabe'), ('Nyanza'), ('Nyaruguru'), ('Ruhango')) AS d(name);

-- Western Province
WITH western AS (SELECT id FROM public.provinces WHERE name = 'Western Province')
INSERT INTO public.districts (province_id, name) 
SELECT western.id, d.name FROM western, (VALUES ('Karongi'), ('Ngororero'), ('Nyabihu'), ('Nyamasheke'), ('Rubavu'), ('Rusizi'), ('Rutsiro')) AS d(name);

-- Insert all sectors for City of Kigali
-- Gasabo District
WITH gasabo AS (SELECT id FROM public.districts WHERE name = 'Gasabo')
INSERT INTO public.sectors (district_id, name)
SELECT gasabo.id, s.name FROM gasabo, (VALUES ('Bumbogo'), ('Gatsata'), ('Gikomero'), ('Gisozi'), ('Jabana'), ('Jali'), ('Kacyiru'), ('Kimihurura'), ('Kimironko'), ('Kinyinya'), ('Ndera'), ('Nduba'), ('Remera'), ('Rusororo'), ('Rutunga')) AS s(name);

-- Kicukiro District
WITH kicukiro AS (SELECT id FROM public.districts WHERE name = 'Kicukiro')
INSERT INTO public.sectors (district_id, name)
SELECT kicukiro.id, s.name FROM kicukiro, (VALUES ('Gahanga'), ('Gatenga'), ('Gikondo'), ('Kagarama'), ('Kanombe'), ('Kicukiro'), ('Kigarama'), ('Masaka'), ('Niboye'), ('Nyarugunga')) AS s(name);

-- Nyarugenge District
WITH nyarugenge AS (SELECT id FROM public.districts WHERE name = 'Nyarugenge')
INSERT INTO public.sectors (district_id, name)
SELECT nyarugenge.id, s.name FROM nyarugenge, (VALUES ('Gitega'), ('Kanyinya'), ('Kigali'), ('Kimisagara'), ('Mageragere'), ('Muhima'), ('Nyakabanda'), ('Nyamirambo'), ('Nyarugenge'), ('Rwezamenyo')) AS s(name);

-- Insert sectors for Eastern Province
-- Bugesera District
WITH bugesera AS (SELECT id FROM public.districts WHERE name = 'Bugesera')
INSERT INTO public.sectors (district_id, name)
SELECT bugesera.id, s.name FROM bugesera, (VALUES ('Gashora'), ('Juru'), ('Kamabuye'), ('Mareba'), ('Mayange'), ('Musenyi'), ('Mwogo'), ('Ngeruka'), ('Nyamata'), ('Nyarugenge'), ('Rilima'), ('Ruhuha'), ('Rweru'), ('Shyara')) AS s(name);

-- Gatsibo District
WITH gatsibo AS (SELECT id FROM public.districts WHERE name = 'Gatsibo')
INSERT INTO public.sectors (district_id, name)
SELECT gatsibo.id, s.name FROM gatsibo, (VALUES ('Gasange'), ('Gatsibo'), ('Gitoki'), ('Kabarore'), ('Kageyo'), ('Kiramuruzi'), ('Kiziguro'), ('Muhura'), ('Murambi'), ('Ngarama'), ('Nyagihanga'), ('Remera'), ('Rugarama'), ('Rwimbogo')) AS s(name);

-- Kayonza District
WITH kayonza AS (SELECT id FROM public.districts WHERE name = 'Kayonza')
INSERT INTO public.sectors (district_id, name)
SELECT kayonza.id, s.name FROM kayonza, (VALUES ('Gahini'), ('Kabare'), ('Kabarondo'), ('Mukarange'), ('Murama'), ('Murundi'), ('Mwiri'), ('Ndego'), ('Nyamirama'), ('Rukara'), ('Ruramira'), ('Rwinkwavu')) AS s(name);

-- Kirehe District
WITH kirehe AS (SELECT id FROM public.districts WHERE name = 'Kirehe')
INSERT INTO public.sectors (district_id, name)
SELECT kirehe.id, s.name FROM kirehe, (VALUES ('Gahara'), ('Gatore'), ('Kigarama'), ('Kigina'), ('Kirehe'), ('Mahama'), ('Mpanga'), ('Musaza'), ('Mushikiri'), ('Nasho'), ('Nyamugari'), ('Nyarubuye')) AS s(name);

-- Ngoma District
WITH ngoma AS (SELECT id FROM public.districts WHERE name = 'Ngoma')
INSERT INTO public.sectors (district_id, name)
SELECT ngoma.id, s.name FROM ngoma, (VALUES ('Gashanda'), ('Jarama'), ('Karembo'), ('Kazo'), ('Kibungo'), ('Mugesera'), ('Murama'), ('Mutenderi'), ('Remera'), ('Rukira'), ('Rukumberi'), ('Rurenge'), ('Sake'), ('Zaza')) AS s(name);

-- Nyagatare District
WITH nyagatare AS (SELECT id FROM public.districts WHERE name = 'Nyagatare')
INSERT INTO public.sectors (district_id, name)
SELECT nyagatare.id, s.name FROM nyagatare, (VALUES ('Gatunda'), ('Karama'), ('Karangazi'), ('Katabagemu'), ('Kiyombe'), ('Matimba'), ('Mimuli'), ('Mukama'), ('Musheli'), ('Nyagatare'), ('Rukomo'), ('Rwempasha'), ('Rwimiyaga'), ('Tabagwe')) AS s(name);

-- Rwamagana District
WITH rwamagana AS (SELECT id FROM public.districts WHERE name = 'Rwamagana')
INSERT INTO public.sectors (district_id, name)
SELECT rwamagana.id, s.name FROM rwamagana, (VALUES ('Fumbwe'), ('Gahengeri'), ('Gishari'), ('Karenge'), ('Kigabiro'), ('Muhazi'), ('Munyaga'), ('Munyiginya'), ('Musha'), ('Muyumbu'), ('Mwulire'), ('Nyakariro'), ('Nzige'), ('Rubona')) AS s(name);

-- Insert sectors for Northern Province
-- Burera District
WITH burera AS (SELECT id FROM public.districts WHERE name = 'Burera')
INSERT INTO public.sectors (district_id, name)
SELECT burera.id, s.name FROM burera, (VALUES ('Bungwe'), ('Butaro'), ('Cyanika'), ('Cyeru'), ('Gahunga'), ('Gatebe'), ('Gitovu'), ('Kagogo'), ('Kinoni'), ('Kinyababa'), ('Kivuye'), ('Nemba'), ('Rugarama'), ('Rugendabari'), ('Ruhunde'), ('Rusarabuge'), ('Rwerere')) AS s(name);

-- Gakenke District
WITH gakenke AS (SELECT id FROM public.districts WHERE name = 'Gakenke')
INSERT INTO public.sectors (district_id, name)
SELECT gakenke.id, s.name FROM gakenke, (VALUES ('Busengo'), ('Coko'), ('Cyabingo'), ('Gakenke'), ('Gashenyi'), ('Janja'), ('Kamubuga'), ('Karambo'), ('Kivuruga'), ('Mataba'), ('Minazi'), ('Mugunga'), ('Muhondo'), ('Muyongwe'), ('Muzo'), ('Nemba'), ('Ruli'), ('Rusasa'), ('Rushashi')) AS s(name);

-- Gicumbi District
WITH gicumbi AS (SELECT id FROM public.districts WHERE name = 'Gicumbi')
INSERT INTO public.sectors (district_id, name)
SELECT gicumbi.id, s.name FROM gicumbi, (VALUES ('Bukure'), ('Bwisige'), ('Byumba'), ('Cyumba'), ('Giti'), ('Kageyo'), ('Kaniga'), ('Manyagiro'), ('Miyove'), ('Mukarange'), ('Muko'), ('Mutete'), ('Nyamiyaga'), ('Nyankenke II'), ('Rubaya'), ('Rukomo'), ('Rushaki'), ('Rutare'), ('Ruvune'), ('Rwamiko'), ('Shangasha')) AS s(name);

-- Musanze District
WITH musanze AS (SELECT id FROM public.districts WHERE name = 'Musanze')
INSERT INTO public.sectors (district_id, name)
SELECT musanze.id, s.name FROM musanze, (VALUES ('Busogo'), ('Cyuve'), ('Gacaca'), ('Gashaki'), ('Gataraga'), ('Kimonyi'), ('Kinigi'), ('Muhoza'), ('Muko'), ('Musanze'), ('Nkotsi'), ('Nyange'), ('Remera'), ('Rwaza'), ('Shingiro')) AS s(name);

-- Rulindo District
WITH rulindo AS (SELECT id FROM public.districts WHERE name = 'Rulindo')
INSERT INTO public.sectors (district_id, name)
SELECT rulindo.id, s.name FROM rulindo, (VALUES ('Base'), ('Burega'), ('Bushoki'), ('Buyoga'), ('Cyinzuzi'), ('Cyungo'), ('Kinihira'), ('Kisaro'), ('Masoro'), ('Mbogo'), ('Murambi'), ('Ngoma'), ('Ntarabana'), ('Rukozo'), ('Rusiga'), ('Shyorongi'), ('Tumba')) AS s(name);

-- Insert sectors for Southern Province
-- Gisagara District
WITH gisagara AS (SELECT id FROM public.districts WHERE name = 'Gisagara')
INSERT INTO public.sectors (district_id, name)
SELECT gisagara.id, s.name FROM gisagara, (VALUES ('Gikonko'), ('Gishubi'), ('Kansi'), ('Kibilizi'), ('Kigembe'), ('Mamba'), ('Muganza'), ('Mugombwa'), ('Mukindo'), ('Musha'), ('Ndora'), ('Nyanza'), ('Save')) AS s(name);

-- Huye District
WITH huye AS (SELECT id FROM public.districts WHERE name = 'Huye')
INSERT INTO public.sectors (district_id, name)
SELECT huye.id, s.name FROM huye, (VALUES ('Gishamvu'), ('Huye'), ('Karama'), ('Kigoma'), ('Kinazi'), ('Maraba'), ('Mbazi'), ('Mukura'), ('Ngoma'), ('Ruhashya'), ('Rusatira'), ('Rwaniro'), ('Simbi'), ('Tumba')) AS s(name);

-- Kamonyi District
WITH kamonyi AS (SELECT id FROM public.districts WHERE name = 'Kamonyi')
INSERT INTO public.sectors (district_id, name)
SELECT kamonyi.id, s.name FROM kamonyi, (VALUES ('Gacurabwenge'), ('Karama'), ('Kayenzi'), ('Kayumbu'), ('Mugina'), ('Musambira'), ('Ngamba'), ('Nyamiyaga'), ('Nyarubaka'), ('Rugalika'), ('Rukoma'), ('Runda')) AS s(name);

-- Muhanga District
WITH muhanga AS (SELECT id FROM public.districts WHERE name = 'Muhanga')
INSERT INTO public.sectors (district_id, name)
SELECT muhanga.id, s.name FROM muhanga, (VALUES ('Cyeza'), ('Kabacuzi'), ('Kibangu'), ('Kiyumba'), ('Muhanga'), ('Mushishiro'), ('Nyabinoni'), ('Nyamabuye'), ('Nyarusange'), ('Rongi'), ('Rugendabari'), ('Shyogwe')) AS s(name);

-- Nyamagabe District
WITH nyamagabe AS (SELECT id FROM public.districts WHERE name = 'Nyamagabe')
INSERT INTO public.sectors (district_id, name)
SELECT nyamagabe.id, s.name FROM nyamagabe, (VALUES ('Buruhukiro'), ('Cyanika'), ('Gasaka'), ('Gatare'), ('Kaduha'), ('Kamegeli'), ('Kibirizi'), ('Kibumbwe'), ('Kitabi'), ('Mbazi'), ('Mugano'), ('Musange'), ('Musebeya'), ('Mushubi'), ('Nkomane'), ('Nyamagabe'), ('Shingiro')) AS s(name);

-- Nyanza District
WITH nyanza AS (SELECT id FROM public.districts WHERE name = 'Nyanza')
INSERT INTO public.sectors (district_id, name)
SELECT nyanza.id, s.name FROM nyanza, (VALUES ('Busasamana'), ('Busoro'), ('Cyabakamyi'), ('Kibirizi'), ('Kigoma'), ('Mukingo'), ('Muyira'), ('Ntyazo'), ('Nyagisozi'), ('Rwabicuma')) AS s(name);

-- Nyaruguru District
WITH nyaruguru AS (SELECT id FROM public.districts WHERE name = 'Nyaruguru')
INSERT INTO public.sectors (district_id, name)
SELECT nyaruguru.id, s.name FROM nyaruguru, (VALUES ('Busanze'), ('Cyahinda'), ('Kibeho'), ('Kivu'), ('Mata'), ('Muganza'), ('Munini'), ('Ngera'), ('Ngoma'), ('Nyabimata'), ('Nyagisozi'), ('Ruheru'), ('Ruramba'), ('Rusenge')) AS s(name);

-- Ruhango District
WITH ruhango AS (SELECT id FROM public.districts WHERE name = 'Ruhango')
INSERT INTO public.sectors (district_id, name)
SELECT ruhango.id, s.name FROM ruhango, (VALUES ('Bweramana'), ('Byimana'), ('Kabagari'), ('Kinazi'), ('Kinihira'), ('Mbuye'), ('Mwendo'), ('Ntongwe'), ('Nyamagana'), ('Ruhango')) AS s(name);

-- Insert sectors for Western Province
-- Karongi District
WITH karongi AS (SELECT id FROM public.districts WHERE name = 'Karongi')
INSERT INTO public.sectors (district_id, name)
SELECT karongi.id, s.name FROM karongi, (VALUES ('Bwishyura'), ('Gihira'), ('Gishyita'), ('Gisovu'), ('Gitesi'), ('Mubuga'), ('Murambi'), ('Murundi'), ('Mutuntu'), ('Rubengera'), ('Rugabano'), ('Ruganda'), ('Rwankuba'), ('Twumba')) AS s(name);

-- Ngororero District
WITH ngororero AS (SELECT id FROM public.districts WHERE name = 'Ngororero')
INSERT INTO public.sectors (district_id, name)
SELECT ngororero.id, s.name FROM ngororero, (VALUES ('Bwira'), ('Gatumba'), ('Hindiro'), ('Kabaya'), ('Kageyo'), ('Kavumu'), ('Matyazo'), ('Muhanda'), ('Muhororo'), ('Ndaro'), ('Ngororero'), ('Nyange'), ('Sovu'), ('Tumba')) AS s(name);

-- Nyabihu District
WITH nyabihu AS (SELECT id FROM public.districts WHERE name = 'Nyabihu')
INSERT INTO public.sectors (district_id, name)
SELECT nyabihu.id, s.name FROM nyabihu, (VALUES ('Bigogwe'), ('Jenda'), ('Jomba'), ('Kabatwa'), ('Karago'), ('Kintobo'), ('Mukamira'), ('Muringa'), ('Rambura'), ('Rugera'), ('Rurembo'), ('Shyira')) AS s(name);

-- Nyamasheke District
WITH nyamasheke AS (SELECT id FROM public.districts WHERE name = 'Nyamasheke')
INSERT INTO public.sectors (district_id, name)
SELECT nyamasheke.id, s.name FROM nyamasheke, (VALUES ('Bushekeri'), ('Bushenge'), ('Cyato'), ('Gihombo'), ('Kagano'), ('Kanjongo'), ('Karambi'), ('Karengera'), ('Kirimbi'), ('Macuba'), ('Mahembe'), ('Maliba'), ('Mugano'), ('Rangiro'), ('Shangi'), ('Souvu')) AS s(name);

-- Rubavu District
WITH rubavu AS (SELECT id FROM public.districts WHERE name = 'Rubavu')
INSERT INTO public.sectors (district_id, name)
SELECT rubavu.id, s.name FROM rubavu, (VALUES ('Bugeshi'), ('Busasamana'), ('Cyanzarwe'), ('Gisenyi'), ('Kanama'), ('Kanzenze'), ('Mudende'), ('Nyakiliba'), ('Nyamyumba'), ('Nyundo'), ('Rubavu'), ('Rugerero')) AS s(name);

-- Rusizi District
WITH rusizi AS (SELECT id FROM public.districts WHERE name = 'Rusizi')
INSERT INTO public.sectors (district_id, name)
SELECT rusizi.id, s.name FROM rusizi, (VALUES ('Bugarama'), ('Butare'), ('Bweyeye'), ('Gashonga'), ('Giheke'), ('Gihundwe'), ('Gikundamvura'), ('Gitambi'), ('Kamembe'), ('Muganza'), ('Mururu'), ('Nkanka'), ('Nkombo'), ('Nkungu'), ('Nyakabuye'), ('Nyakarenzo'), ('Nyange'), ('Nzahaha'), ('Rwamba'), ('Sange')) AS s(name);

-- Rutsiro District
WITH rutsiro AS (SELECT id FROM public.districts WHERE name = 'Rutsiro')
INSERT INTO public.sectors (district_id, name)
SELECT rutsiro.id, s.name FROM rutsiro, (VALUES ('Boneza'), ('Gihango'), ('Kigeyo'), ('Kivumu'), ('Manihira'), ('Mukura'), ('Murunda'), ('Musasa'), ('Mushonyi'), ('Mushubati'), ('Nyabirasi'), ('Nyange'), ('Rubavu'), ('Rugabano'), ('Rusebeya'), ('Rutsiro'), ('Urumuri')) AS s(name);