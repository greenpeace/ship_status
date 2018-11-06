class String
  def slug
    self.strip.to_ascii.downcase.gsub(/('|\([^\)]+\))+/,"").gsub(/\W+/,"-").sub(/(\d|\s|,)+$/,"").gsub(/(^-|-$)/,"")
  end
end

module Enumerable

  def sum
    self.inject(0){|i,j| i + j }
  end

  def avg circular=false
    if circular
      x, y = 0, 0
      self.each do |e|
        x += Math.cos( e / 180.0 * Math::PI )
        y += Math.sin( e / 180.0 * Math::PI )
      end
      Math.atan2(y, x) * 180.0 / Math::PI
    else
      self.sum/self.length.to_f
    end
  end

  def smp_var circular=false
    m = self.avg(circular)
    if circular
      sum = self.inject(0) do |i,j|
        [(i-j).abs,(j-i).abs].min
      end
    else 
      sum = self.inject(0){|accum, i| accum +(i-m)**2 }
    end
    sum/(self.length - 1).to_f
  end

  def std_dev circular=false
    return 0 if self.smp_var.nan?
    Math.sqrt(self.smp_var(circular))
  end

end 

