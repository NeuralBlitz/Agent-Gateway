---
name: Ruby on Rails
category: web-development
description: A server-side web application framework written in Ruby with convention over configuration
tags:
  - backend
  - ruby
  - mvc
  - convention
---

# Ruby on Rails

## What I do

I am a server-side web application framework written in Ruby, created by David Heinemeier Hansson. I follow the Model-View-Controller (MVC) pattern and emphasize the use of web standards, data representation, and separation of concerns. I embrace "convention over configuration," meaning I provide sensible defaults that reduce the amount of code you need to write. I'm designed for developer happiness and rapid application development.

## When to use me

- Building database-driven web applications rapidly
- When you prefer convention over configuration
- Startups and MVPs requiring fast development cycles
- Projects needing RESTful APIs and web interfaces
- When you value code readability and Ruby syntax
- Applications requiring complex database relationships
- Real-time features with Action Cable
- When you want an established ecosystem with gems

## Core Concepts

- **MVC Pattern**: Models for data, Views for presentation, Controllers for logic
- **Active Record**: ORM for database interactions
- **Action Controller**: Handling web requests and responses
- **Action View**: Template rendering with ERB
- **Routing**: RESTful routes with resources
- **Migrations**: Database schema changes as version control
- **Associations**: Relationships between models (belongs_to, has_many)
- **Validations**: Data integrity constraints
- **Callbacks**: Hooks at various points in model lifecycle
- **Gems**: Reusable Ruby libraries

## Code Examples

### Models with Active Record

```ruby
# app/models/user.rb
class User < ApplicationRecord
  has_secure_password
  
  has_many :posts, dependent: :destroy
  has_many :comments, dependent: :destroy
  
  validates :username, presence: true, uniqueness: { case_sensitive: false },
                      length: { minimum: 3, maximum: 30 }
  validates :email, presence: true, uniqueness: true,
                   format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, if: -> { new_record? || !password.nil? }
  
  before_validation :downcase_attributes
  
  scope :active, -> { where(active: true) }
  scope :by_role, ->(role) { where(role: role) }
  scope :recent, -> { order(created_at: :desc) }
  
  def full_name
    "#{first_name} #{last_name}".strip
  end
  
  private
  
  def downcase_attributes
    username.downcase! if username.present?
    email.downcase! if email.present?
  end
end
```

```ruby
# app/models/post.rb
class Post < ApplicationRecord
  belongs_to :author, class_name: 'User', foreign_key: 'user_id'
  belongs_to :category, optional: true
  
  has_many :comments, dependent: :destroy
  has_many :taggings, dependent: :destroy
  has_many :tags, through: :taggings
  
  validates :title, presence: true, length: { minimum: 5, maximum: 200 }
  validates :content, presence: true, length: { minimum: 50 }
  validates :slug, uniqueness: true
  
  before_validation :generate_slug, on: :create
  
  enum status: { draft: 0, published: 1, archived: 2 }
  
  scope :published, -> { where(status: :published) }
  scope :by_category, ->(category) { where(category_id: category) }
  scope :tagged_with, ->(tag) { joins(:tags).where(tags: { name: tag }) }
  
  def tag_list
    tags.pluck(:name).join(', ')
  end
  
  def tag_list=(names)
    self.tags = names.split(',').map do |name|
      Tag.find_or_create_by(name: name.strip.downcase)
    end
  end
  
  private
  
  def generate_slug
    self.slug = title.parameterize if slug.nil? && title.present?
  end
end
```

### Controllers

```ruby
# app/controllers/posts_controller.rb
class PostsController < ApplicationController
  before_action :set_post, only: [:show, :update, :destroy]
  before_action :authenticate_user!, except: [:index, :show]
  before_action :authorize_user!, only: [:update, :destroy]
  
  def index
    @posts = Post.published.by_category(params[:category])
                 .tagged_with(params[:tag])
                 .page(params[:page])
                 .per(10)
    
    render json: @posts, each_serializer: PostSerializer
  end
  
  def show
    render json: PostSerializer.new(@post).as_json
  end
  
  def create
    @post = current_user.posts.build(post_params)
    
    if @post.save
      render json: PostSerializer.new(@post), status: :created
    else
      render json: { errors: @post.errors.full_messages }, status: :unprocessable_entity
    end
  end
  
  def update
    if @post.update(post_params)
      render json: PostSerializer.new(@post)
    else
      render json: { errors: @post.errors.full_messages }, status: :unprocessable_entity
    end
  end
  
  def destroy
    @post.destroy
    head :no_content
  end
  
  private
  
  def set_post
    @post = Post.find(params[:id])
  end
  
  def post_params
    params.require(:post).permit(:title, :content, :category_id, :tag_list, :status)
  end
  
  def authorize_user!
    unless @post.author == current_user
      render json: { error: 'Not authorized' }, status: :forbidden
    end
  end
end
```

### Routing Configuration

```ruby
# config/routes.rb
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :users, only: [:index, :show, :create, :update, :destroy] do
        resources :posts, only: [:index], shallow: true
      end
      
      resources :posts do
        resources :comments, only: [:index, :create, :update, :destroy]
        member do
          put :publish
          put :archive
        end
      end
      
      resources :categories, only: [:index, :show, :create, :update, :destroy]
      
      get :tags, to: 'tags#index'
      get :tags/:name, to: 'tags#show', as: :tag
      
      post :auth/login, to: 'sessions#create'
      delete :auth/logout, to: 'sessions#destroy'
      get :auth/me, to: 'users#me'
    end
  end
  
  root to: 'home#index'
end
```

### Migrations

```ruby
# db/migrate/20240101000000_create_users.rb
class CreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |t|
      t.string :username, null: false, index: { unique: true }
      t.string :email, null: false, index: { unique: true }
      t.string :password_digest, null: false
      t.string :role, default: 'user'
      t.text :bio
      t.string :avatar
      t.boolean :active, default: true
      t.timestamps
    end
    
    add_index :users, [:username, :email]
  end
end
```

### Services and Jobs

```ruby
# app/services/post_creator.rb
class PostCreator
  def initialize(user, params)
    @user = user
    @params = params
  end
  
  def create
    Post.transaction do
      post = @user.posts.create!(@params)
      
      if @params[:notify_subscribers]
        PostMailer.new_post_notification(post).deliver_later
      end
      
      post
    end
  rescue ActiveRecord::RecordInvalid => e
    { error: e.message }
  end
end
```

```ruby
# app/jobs/application_job.rb
class ApplicationJob < ActiveJob::Base
  retry_on StandardError, wait: :exponentially_longer, attempts: 5
  
  discard_on ActiveJob::DeserializationError
end
```

```ruby
# app/jobs/post_notifications_job.rb
class PostNotificationsJob < ApplicationJob
  queue_as :default
  
  def perform(post)
    subscribers = post.category.subscribers
    
    subscribers.each do |subscriber|
      PostMailer.new_post_notification(subscriber, post).deliver_now
    end
  end
end
```

### Serializers

```ruby
# app/serializers/post_serializer.rb
class PostSerializer
  include FastJsonapi::ObjectSerializer
  
  attributes :id, :title, :content, :slug, :status, :created_at, :updated_at
  
  attribute :tag_list do |post|
    post.tags.pluck(:name)
  end
  
  belongs_to :author, serializer: UserSerializer
  belongs_to :category, serializer: CategorySerializer
  has_many :comments
end
```

## Best Practices

- **RESTful Design**: Follow REST conventions for routes and controller actions
- **Fat Models, Skinny Controllers**: Keep business logic in models and services
- **Service Objects**: Extract complex business logic into service classes
- **Concerns**: Use concerns for shared module functionality
- **Background Jobs**: Use Active Job for asynchronous processing
- **Caching**: Use fragment caching for expensive view operations
- **Strong Parameters**: Use strong parameters for mass assignment protection
- **Scopes**: Use scopes for commonly used query conditions
- **Callbacks Judiciously**: Use callbacks carefully; prefer explicit methods
- **Testing**: Use RSpec or Minitest with Factory Bot for testing
