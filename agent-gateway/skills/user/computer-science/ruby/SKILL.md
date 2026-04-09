---
name: Ruby
description: Dynamic, interpreted programming language known for elegance and productivity with a focus on simplicity and programmer happiness.
license: BSD 2-Clause "Simplified"
compatibility: Ruby 3.0+
audience: Web developers (Ruby on Rails), automation scripters, DevOps engineers
category: Programming Languages
---

# Ruby

## What I do

I am a dynamic, interpreted programming language created by Yukihiro Matsumoto in 1995. I emphasize programmer happiness and productivity with elegant, natural-feeling syntax. I am the language behind Ruby on Rails, one of the most popular web frameworks. I support multiple programming paradigms including procedural, object-oriented, and functional programming. I feature dynamic typing, duck typing, metaprogramming capabilities, and a "everything is an object" design where even primitive types are objects.

## When to use me

Use Ruby when building web applications with Ruby on Rails, rapid prototyping and MVP development, automation scripts and DevOps tooling, code generation and scaffolding tools, domain-specific languages (DSLs), or when developer happiness and productivity are top priorities.

## Core Concepts

- **Everything is an Object**: Even nil, true, false, and numbers are objects with methods.
- **Duck Typing**: If an object walks like a duck and quacks like a duck, treat it as a duck.
- **Dynamic Typing**: Variable types are determined at runtime, methods can be added to classes at runtime.
- **Blocks, Procs, and Lambdas**: First-class callable objects for iteration, callbacks, and functional patterns.
- **Mixins via Modules**: Composition pattern using modules for code reuse without multiple inheritance.
- **Metaprogramming**: Ability to modify classes and objects at runtime, defining methods dynamically.
- **Open Classes**: Can reopen and modify existing classes including built-in types (monkey patching).
- **Convention over Configuration**: Rails-style defaults reducing boilerplate configuration.
- **Garbage Collection**: Automatic memory management for objects.
- **Symbol Interning**: Symbols are immutable, cached strings used as identifiers and keys.

## Code Examples

**Blocks and Iterators:**
```ruby
numbers = [1, 2, 3, 4, 5]

squares = numbers.map { |n| n ** 2 }
evens = numbers.select(&:even?)
sum = numbers.reduce(0, :+)

puts "Squares: #{squares}"
puts "Evens: #{evens}"
puts "Sum: #{sum}"

hash = { a: 1, b: 2, c: 3 }
transformed = hash.transform_values { |v| v * 10 }
puts "Transformed: #{transformed}"

result = 10.times do |i|
  puts "Iteration #{i}"
end

[1, 2, 3].each_with_index do |num, index|
  puts "Element #{index}: #{num}"
end

class LazyProcessor
  def initialize
    @steps = []
  end
  
  def add_step(name, &block)
    @steps << [name, block]
    self
  end
  
  def process(input)
    @steps.reduce(input) do |data, (name, block)|
      puts "Running step: #{name}"
      block.call(data)
    end
  end
end

processor = LazyProcessor.new
processor
  .add_step("double") { |x| x * 2 }
  .add_step("add one") { |x| x + 1 }
  .add_step("square") { |x| x ** 2 }

result = processor.process(5)
puts "Result: #{result}"
```

**Modules and Mixins:**
```ruby
module Loggable
  def log(message)
    puts "[#{Time.now}] #{self.class}: #{message}"
  end
end

module Encryptable
  def encrypt(data)
    data.bytes.map { |b| b + 1 }.pack("C*")
  end
  
  def decrypt(data)
    data.bytes.map { |b| b - 1 }.pack("C*")
  end
end

class User
  include Loggable
  attr_accessor :name, :email
  
  def initialize(name, email)
    @name = name
    @email = email
  end
  
  def authenticate(password)
    log("Authentication attempt for #{email}")
    password == "secret"
  end
end

class SecureMessage
  include Loggable
  include Encryptable
  
  attr_accessor :content
  
  def initialize(content)
    @content = content
  end
  
  def send
    encrypted = encrypt(content)
    log("Message sent (encrypted): #{encrypted}")
    encrypted
  end
end

user = User.new("Alice", "alice@example.com")
user.authenticate("secret")

message = SecureMessage.new("Hello, World!")
encrypted = message.send
puts "Decrypted: #{message.decrypt(encrypted)}"
```

**Metaprogramming:**
```ruby
class ActiveRecord
  def self.attr_accessor_with_history(*names)
    names.each do |name|
      define_method(name) { instance_variable_get("@#{name}") }
      define_method("#{name}=") do |value|
        history = instance_variable_get("@#{name}_history") || []
        history << instance_variable_get("@#{name}")
        instance_variable_set("@#{name}_history", history)
        instance_variable_set("@#{name}", value)
      end
      define_method("#{name}_history") { instance_variable_get("@#{name}_history") }
    end
  end
  
  attr_accessor_with_history :name, :email
  
  def initialize(attributes = {})
    attributes.each do |key, value|
      send("#{key}=", value) if respond_to?("#{key}=")
    end
  end
end

class User < ActiveRecord
end

user = User.new
user.name = "Alice"
user.name = "Bob"
user.name = "Charlie"

puts user.name_history.inspect
puts user.email_history.inspect
```

**Blocks and Yield:**
```ruby
class DataProcessor
  def initialize(data)
    @data = data
  end
  
  def filter(&block)
    filtered = @data.select(&block)
    DataProcessor.new(filtered)
  end
  
  def map(&block)
    mapped = @data.map(&block)
    DataProcessor.new(mapped)
  end
  
  def reduce(initial = nil, &block)
    if block_given?
      @data.reduce(initial, &block)
    else
      @data.reduce
    end
  end
  
  def each(&block)
    @data.each(&block)
    self
  end
  
  def to_a
    @data
  end
end

processor = DataProcessor.new([1, 2, 3, 4, 5])

result = processor
  .filter { |n| n.even? }
  .map { |n| n * 10 }
  .each { |n| puts "Value: #{n}" }
  .reduce(0) { |sum, n| sum + n }

puts "Final result: #{result}"

def with_timing
  start = Time.now
  yield
  elapsed = Time.now - start
  puts "Elapsed time: #{elapsed.round(3)} seconds"
end

with_timing { sleep(0.1) }
```

## Best Practices

1. **Follow Ruby Style Guide**: Use consistent naming conventions (snake_case for variables/methods, PascalCase for classes/modules).
2. **Prefer Blocks Over Procs**: Use blocks for simple callbacks, procs/lambdas when you need to pass around callable objects.
3. **Use Symbol for Keys**: Use symbols as hash keys (symbol: value syntax) for better performance than strings.
4. **Avoid Monkey Patching Core Classes**: While possible, modifying built-in classes can lead to confusion and bugs.
5. **Use Hash.fetch for Missing Keys**: Use Hash#fetch with default values instead of || operator for missing keys.
6. **Prefer reduce Over Manual Accumulation**: Use inject/reduce for accumulating values in loops.
7. **Use Safe Navigation Operator (&.)**: Use &. for chaining methods that might return nil.
8. **Keep Methods Short**: Methods should do one thing; if you need "and" in the description, split it.
9. **Write Tests with RSpec/Minitest**: Use BDD-style tests with RSpec or simpler tests with Minitest.
10. **Use Bundle for Dependencies**: Always use Bundler (Gemfile) to manage dependencies for reproducibility.
