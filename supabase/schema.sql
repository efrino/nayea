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

-- Table: orders
create table if not exists orders (
  id uuid default uuid_generate_v4() primary key,
  customer_name text not null,
  customer_phone text not null,
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
  image_url text not null,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: messages (for chat)
create table if not exists messages (
  id uuid default uuid_generate_v4() primary key,
  session_id text not null,
  sender text not null check (sender in ('customer', 'admin')),
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. PRODUCTS TABLE POLICIES
-- Enable RLS
alter table products enable row level security;

-- Policy: Everyone can view products
create policy "Public can view products" 
on products for select 
using (true);

-- Policy: Anyone can insert, update, or delete products (FOR DEVELOPMENT ONLY)
-- Note: In production, you would restrict this to authenticated admins using auth.uid()
create policy "Anyone can insert products" 
on products for insert 
with check (true);

create policy "Anyone can update products" 
on products for update 
using (true);

create policy "Anyone can delete products" 
on products for delete 
using (true);


-- 2. ORDERS & ORDER_ITEMS TABLE POLICIES 
alter table orders enable row level security;
alter table order_items enable row level security;

-- Policy: Anyone can insert orders (so customers can checkout)
create policy "Anyone can insert orders" 
on orders for insert 
with check (true);

create policy "Anyone can insert order_items" 
on order_items for insert 
with check (true);

-- Policy: Admin can view and update all orders
create policy "Anyone can view orders" 
on orders for select 
using (true);

create policy "Anyone can update orders" 
on orders for update 
using (true);

create policy "Anyone can view order_items" 
on order_items for select 
using (true);


-- 3. STORAGE POLICIES (Run this manually in SQL Editor if bucket policies fail in dashboard)
-- This requires you to have already created the "products" bucket.
-- Insert a bucket if it doesn't exist (optional direct SQL method):
insert into storage.buckets (id, name, public) 
values ('products', 'products', true)
on conflict (id) do nothing;

-- Policy: Public can view images in the "products" bucket
create policy "Public Access to product images"
on storage.objects for select
using ( bucket_id = 'products' );

-- Policy: Anyone can upload images to the "products" bucket
create policy "Anyone can upload product images"
on storage.objects for insert
with check ( bucket_id = 'products' );

create policy "Anyone can update product images"
on storage.objects for update
using ( bucket_id = 'products' );

create policy "Anyone can delete product images"
on storage.objects for delete
using ( bucket_id = 'products' );
