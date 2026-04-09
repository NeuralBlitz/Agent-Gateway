---
name: ruby
description: Ruby programming language and Rails framework
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: programming
---
## What I do
- Write idiomatic Ruby
- Use Rails patterns
- Implement metaprogramming
- Handle RubyGems
- Use RSpec for testing
- Implement ActiveRecord
- Use Rails routing
- Handle background jobs

## When to use me
When writing Ruby or Rails code.

## Ruby Patterns
```ruby
# Metaprogramming
class BaseService
  def self.inherited(subclass)
    define_method(subclass.name.underscore) do |**args|
      klass = Object.const_get(subclass.name)
      klass.new(**args).execute
    end
  end
end

# Blocks and yield
def with_transaction
  ActiveRecord::Base.transaction do
    yield
  rescue => e
    rollback!
    raise e
  end
end

# Rails patterns
class UsersController < ApplicationController
  before_action :set_user, only: [:show, :update]
  
  def index
    @users = User.all.page(params[:page])
    render json: @users
  end
  
  private
  
  def set_user
    @user = User.find(params[:id])
  end
end
```
