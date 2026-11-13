import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jqnzhbcgrsrtiuuntocm.supabase.co';

const SUPABASE_KEY = 'sb_publishable_KNuwiOjXt8UoMFernB7_aQ_MnvSIlQs';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);