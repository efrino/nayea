-- Nayea.id Supabase Schema & Policies

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: products
create table if not exists products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null,
  stock integer default 0,
  is_preorder boolean default false,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Phase 11 Upgrades to products
alter table products 
  add column if not exists images text[] default '{}',
  add column if not exists video_url text,
  add column if not exists colors text[] default '{}',
  add column if not exists material text;

-- Table: wishlists
create table if not exists wishlists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- Table: cart_items
create table if not exists cart_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  selected_color text,
  quantity integer not null check (quantity > 0) default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id, selected_color)
);

-- Table: orders
create table if not exists orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  shipping_address text,
  shipping_courier text,
  shipping_cost numeric default 0,
  total_amount numeric not null,
  status text default 'pending' check (status in ('pending', 'paid', 'shipped', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: order_items
create table if not exists order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete restrict not null,
  quantity integer not null check (quantity > 0),
  price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: banners
create table if not exists banners (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  image_url text not null,
  link_url text,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: messages (for chat)
drop table if exists messages cascade;
create table messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  sender text not null check (sender in ('customer', 'admin')),
  text text not null,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'read')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Phase 14: Add status column to existing messages table if it doesn't exist
alter table messages add column if not exists status text not null default 'sent' check (status in ('sent', 'delivered', 'read'));



-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. PRODUCTS TABLE POLICIES
-- Enable RLS
alter table products enable row level security;

-- Policy: Everyone can view products
drop policy if exists "Public can view products" on products;
create policy "Public can view products" 
on products for select 
using (true);

-- Policy: Admin can insert, update, or delete products
drop policy if exists "Admin can insert products" on products;
drop policy if exists "Anyone can insert products" on products;
create policy "Admin can insert products" 
on products for insert 
with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "Admin can update products" on products;
drop policy if exists "Anyone can update products" on products;
create policy "Admin can update products" 
on products for update 
using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "Admin can delete products" on products;
drop policy if exists "Anyone can delete products" on products;
create policy "Admin can delete products" 
on products for delete 
using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 1.5 WISHLISTS & CART_ITEMS POLICIES
alter table wishlists enable row level security;
alter table cart_items enable row level security;

-- Users can only see, insert, update, delete their own wishlists/carts
drop policy if exists "Users can manage their own wishlists" on wishlists;
create policy "Users can manage their own wishlists"
on wishlists for all
using (auth.role() = 'authenticated' AND user_id = auth.uid())
with check (auth.role() = 'authenticated' AND user_id = auth.uid());

drop policy if exists "Users can manage their own carts" on cart_items;
create policy "Users can manage their own carts"
on cart_items for all
using (auth.role() = 'authenticated' AND user_id = auth.uid())
with check (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 2. ORDERS & ORDER_ITEMS TABLE POLICIES 
alter table orders enable row level security;
alter table order_items enable row level security;

-- Policy: Anyone can insert orders (so customers can checkout)
drop policy if exists "Anyone can insert orders" on orders;
create policy "Anyone can insert orders" 
on orders for insert 
with check (true);

drop policy if exists "Anyone can insert order_items" on order_items;
create policy "Anyone can insert order_items" 
on order_items for insert 
with check (true);

-- Policy: Admin can view and update all orders
drop policy if exists "Admin can view orders" on orders;
drop policy if exists "Anyone can view orders" on orders;
create policy "Admin can view orders" 
on orders for select 
using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "Admin can update orders" on orders;
drop policy if exists "Anyone can update orders" on orders;
create policy "Admin can update orders" 
on orders for update 
using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "Admin can view order_items" on order_items;
drop policy if exists "Anyone can view order_items" on order_items;
create policy "Admin can view order_items" 
on order_items for select 
using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');


-- 3. STORAGE POLICIES (Run this manually in SQL Editor if bucket policies fail in dashboard)
-- This requires you to have already created the "products" bucket.
-- Insert a bucket if it doesn't exist (optional direct SQL method):
insert into storage.buckets (id, name, public) 
values ('products', 'products', true)
on conflict (id) do nothing;

-- Policy: Public can view images in the "products" bucket
drop policy if exists "Public Access to product images" on storage.objects;
create policy "Public Access to product images"
on storage.objects for select
using ( bucket_id = 'products' );

-- Policy: Admin can upload images to the "products" bucket
drop policy if exists "Admin can upload product images" on storage.objects;
drop policy if exists "Anyone can upload product images" on storage.objects;
create policy "Admin can upload product images"
on storage.objects for insert
with check ( bucket_id = 'products' AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

drop policy if exists "Admin can update product images" on storage.objects;
drop policy if exists "Anyone can update product images" on storage.objects;
create policy "Admin can update product images"
on storage.objects for update
using ( bucket_id = 'products' AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

drop policy if exists "Admin can delete product images" on storage.objects;
drop policy if exists "Anyone can delete product images" on storage.objects;
create policy "Admin can delete product images"
on storage.objects for delete
using ( bucket_id = 'products' AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );


-- 4. BANNERS TABLE POLICIES
alter table banners enable row level security;

drop policy if exists "Public can view banners" on banners;
create policy "Public can view banners" 
on banners for select 
using (true);

drop policy if exists "Admin can insert banners" on banners;
create policy "Admin can insert banners" 
on banners for insert 
with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "Admin can update banners" on banners;
create policy "Admin can update banners" 
on banners for update 
using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "Admin can delete banners" on banners;
create policy "Admin can delete banners" 
on banners for delete 
using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');


-- 5. MESSAGES TABLE POLICIES (Live Chat)
alter table messages enable row level security;

-- Customers can insert their own messages, Admins can do anything.
drop policy if exists "Authenticated users can insert messages" on messages;
create policy "Authenticated users can insert messages" 
on messages for insert 
with check (
  auth.role() = 'authenticated' AND (
    (user_id = auth.uid() AND sender = 'customer') OR 
    ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND sender = 'admin')
  )
);

-- Customers can read their own messages, Admin sees all
drop policy if exists "Authenticated users can read messages" on messages;
create policy "Authenticated users can read messages" 
on messages for select 
using (
  auth.role() = 'authenticated' AND (
    user_id = auth.uid() OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
);

-- Admin can update message status (delivered, read) — REQUIRED for read receipts
drop policy if exists "Admin can update message status" on messages;
create policy "Admin can update message status"
on messages for update
using (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
with check (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Customer can update status of ADMIN messages in their own session
-- This enables the admin outgoing tick to change when customer reads the message
drop policy if exists "Customer can mark admin messages as read" on messages;
create policy "Customer can mark admin messages as read"
on messages for update
using (
  user_id = auth.uid() AND sender = 'admin'
)
with check (
  user_id = auth.uid() AND sender = 'admin'
);

-- Additionally, allow customer to also trigger updates for their own messages
-- when the status changes due to other DB processes, though admin usually does this.
drop policy if exists "Customer can update own messages" on messages;
create policy "Customer can update own messages"
on messages for update
using (
  user_id = auth.uid() AND sender = 'customer'
)
with check (
  user_id = auth.uid() AND sender = 'customer'
);

-- Enable REPLICA IDENTITY FULL so Realtime broadcasts UPDATE events (not just INSERT)
alter table messages replica identity full;



-- ==============================================================================
-- 6. AUTHENTICATION TRIGGERS (Auto-Role Assignment)
-- ==============================================================================

-- Create a function to force 'customer' role, except for the designated admin email
create or replace function public.on_auth_user_created()
returns trigger as $$
begin
  -- If the email belongs to the predefined super admin
  if new.email = 'efrinowep@gmail.com' then
    new.raw_user_meta_data = coalesce(new.raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb;
  else
    -- Force everyone else to be a customer, overriding any API injections
    new.raw_user_meta_data = coalesce(new.raw_user_meta_data, '{}'::jsonb) || '{"role": "customer"}'::jsonb;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Attach the trigger to Supabase auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  before insert on auth.users
  for each row execute procedure public.on_auth_user_created();

-- Enable Realtime for messages table
alter publication supabase_realtime add table messages;


-- 6. BANNERS STORAGE BUCKET
insert into storage.buckets (id, name, public) 
values ('banners', 'banners', true)
on conflict (id) do nothing;

drop policy if exists "Public Access to banner images" on storage.objects;
create policy "Public Access to banner images"
on storage.objects for select
using ( bucket_id = 'banners' );

drop policy if exists "Admin can upload banner images" on storage.objects;
create policy "Admin can upload banner images"
on storage.objects for insert
with check ( bucket_id = 'banners' AND auth.role() = 'authenticated' );

drop policy if exists "Admin can update banner images" on storage.objects;
create policy "Admin can update banner images"
on storage.objects for update
using ( bucket_id = 'banners' AND auth.role() = 'authenticated' );

drop policy if exists "Admin can delete banner images" on storage.objects;
create policy "Admin can delete banner images"
on storage.objects for delete
using ( bucket_id = 'banners' AND auth.role() = 'authenticated' );

-- ==============================================================================
-- 7. POSTGRES FUNCTIONS (RPC)
-- ==============================================================================

-- Function to fetch messages joined with user metadata (safe way to read auth.users)
create or replace function get_chat_messages_with_users()
returns table (
  id uuid,
  user_id uuid,
  sender text,
  text text,
  status text,
  created_at timestamp with time zone,
  customer_name text,
  customer_email text
) 
language sql
security definer
as $$
  select 
    m.id,
    m.user_id,
    m.sender,
    m.text,
    m.status,
    m.created_at,
    (u.raw_user_meta_data->>'full_name')::text as customer_name,
    u.email::text as customer_email
  from public.messages m
  left join auth.users u on m.user_id = u.id
  order by m.created_at asc;
$$;

-- ==============================================================================
-- 8. INITIAL ADMIN SETUP (Run this manually in SQL Editor to set the admin role)
-- ==============================================================================

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"admin"'
)
WHERE email = 'efrinowep@gmail.com';
