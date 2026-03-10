-- Nayea.id Supabase Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: products
create table products (
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
create table orders (
  id uuid default uuid_generate_v4() primary key,
  customer_name text not null,
  customer_phone text not null,
  total_amount numeric not null,
  status text default 'pending' check (status in ('pending', 'paid', 'shipped', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: order_items
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete restrict not null,
  quantity integer not null check (quantity > 0),
  price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: banners
create table banners (
  id uuid default uuid_generate_v4() primary key,
  image_url text not null,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: messages (for chat)
create table messages (
  id uuid default uuid_generate_v4() primary key,
  session_id text not null, -- Can be a unique string from browser or UUID
  sender text not null check (sender in ('customer', 'admin')),
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: RLS (Row Level Security) should be configured in the Supabase Dashboard
-- based on your specific access needs.
