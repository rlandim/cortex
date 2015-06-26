﻿function Preloader() {
    self.ItensLoaded = 0;
}
Preloader.prototype.Images = [];
Preloader.prototype.AddImage = function (url) {
    this.Images.push({ url: url, image: null, loaded: false });
};
Preloader.prototype.ItensLoaded = 0;
Preloader.prototype.Load = function () {
    var self = this;
    var total = this.Images.length;

    if (total == 0) {
        self.LoadComplete();
        return;
    }

    for (var index = 0; index < total; index++) {
        var item = this.Images[index];
        item.image = new Image();
        item.onerror = function () {
            console.log('LoadError', item);
        };
        item.image.onload = function () {
            item.loaded = true;
            self.ItensLoaded++;
            if (self.ItensLoaded == total) {
                self.LoadComplete();
            }
        };
        item.image.src = item.url;
    }
};
Preloader.prototype.LoadComplete = function () { };

function World(element) {
    this.LastTime = this.Timestamp();
    this.NowTime = this.LastTime;
    this.Step = 1 / 60;
    this.Paused = true;
    this.CreateContent(element);
    this.ContextStatic = this.CreateContext('static');
    this.ContextDynamic = this.CreateContext('dynamic');
};
World.prototype.Debug = false;
World.prototype.Height = 0;
World.prototype.Width = 0;
World.prototype.ContentElement = null;
World.prototype.ContextDynamic = null;
World.prototype.ContextStatic = null;
World.prototype.FrameElements = [];
World.prototype.Step = 0;
World.prototype.DeltaTime = 0;
World.prototype.NowTime = null;
World.prototype.LastTime = null;
World.prototype.Paused = false;
World.prototype.Timestamp = function () {
    return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
};
World.prototype.CreateContent = function (id) {
    var content = $('#' + id);
    this.ContentElement = id;
    this.Height = content.height();
    this.Width = content.width();
}
World.prototype.CreateContext = function (id) {
    var canvas = $('<canvas/>');
    canvas.attr('id', id);
    canvas.attr('width', this.Width);
    canvas.attr('height', this.Height);
    canvas.appendTo('#' + this.ContentElement);
    var context = canvas[0].getContext('2d');
    return context;
};
World.prototype.Frame = function () {

    world.FrameStarted();
    if (world.Paused === true) {
        world.FramePaused();
        return;
    }

    world.NowTime = world.Timestamp();
    world.DeltaTime = world.DeltaTime + Math.min(1, (world.NowTime - world.LastTime) / 1000);
    while (world.DeltaTime > world.Step) {
        world.DeltaTime = world.DeltaTime - world.Step;
    }

    world.ContextDynamic.clearRect(0, 0, world.Width, world.Height, 'white');
    world.ContextDynamic.save();

    for (var index = 0; index < world.FrameElements.length; index++) {
        var element = world.FrameElements[index];
        element.Update(world.DeltaTime, world.ContextDynamic);
        element.Render(world.ContextDynamic);
    }

    world.ContextDynamic.restore();

    world.LastTime = world.NowTime;
    window.requestAnimationFrame(world.Frame);

    world.FrameEnded();
};
World.prototype.Start = function () {
    if (this.Paused === false) {
        return;
    }
    this.Paused = false;
    window.requestAnimationFrame(this.Frame);
};
World.prototype.Pause = function () {
    this.Paused = true;
};
World.prototype.AddFrameElement = function (element) {
    element.Debug = this.Debug;
    element.Render(this.ContextDynamic);
    this.FrameElements.push(element);
};
World.prototype.RemoveFrameElement = function (index) {
    if (index > -1) {
        this.FrameElements.splice(index, 1);
    }
};
World.prototype.FrameStarted = function () { };
World.prototype.FrameEnded = function () { };
World.prototype.FramePaused = function () { };

function Vector2D(x, y) {
    this.X = x;
    this.Y = y;
}
Vector2D.prototype.X = 0;
Vector2D.prototype.Y = 0;
Vector2D.Add = function (v1, v2) {
    return new Vector2D(v1.X + v2.X, v1.Y + v2.Y)
};
Vector2D.Subtract = function (v1, v2) {
    return new Vector2D(v1.X - v2.X, v1.Y - v2.Y);
};
Vector2D.Dot = function (v1, v2) {
    return (v1.X * v2.X) + (v1.Y * v2.Y);
};
Vector2D.Multiply = function (vector, number) {
    return new Vector2D(vector.X * number, vector.Y * number);
};
Vector2D.Divide = function (vector, number) {
    return new Vector2D(vector.X / number, vector.Y / number);
}
Vector2D.Equals = function (v1, v2) {
    return v1.X == v2.X && v1.Y == v2.Y;
};
Vector2D.LengthSquared = function (vector) {
    return Math.pow(vector.X, 2) + Math.pow(vector.Y, 2);
}
Vector2D.Length = function (vector) {
    return Math.sqrt(Vector2D.LengthSquared(vector));
};
Vector2D.DistanceVector = function (v1, v2) {
    return Vector2D.Subtract(v1, v2);
};
Vector2D.Distance = function (v1, v2) {
    var vectorDistance = Vector2D.DistanceVector(v1, v2);
    return Vector2D.Length(vectorDistance);
};
Vector2D.Normalize = function (vector) {
    var length = Vector2D.Length(vector);
    if (length == 0) {
        return new Vector2D(0, 0);
    } else {
        return new Vector2D(vector.X / length, vector.Y / length);
    }
};
Vector2D.Radian = function (vector) {
    return Math.atan2(vector.Y, vector.X);
};
Vector2D.Angle = function (vector) {
    var radian = Vector2D.Radian(vector);
    return radian * 180 / Math.PI;
};
Vector2D.Lerp = function (vectorGoal, vectorCurrent, delta) {
    var distance = Vector2D.DistanceVector(vectorGoal, vectorCurrent);
    return Vector2D.Add(vectorCurrent, Vector2D.Multiply(distance, delta), delta);
};

function Line(start, end) {
    this.Start = start;
    this.End = end;
}
Line.prototype.Start = null;
Line.prototype.End = null;

function Collision() { }
Collision.RayPlaneIntersect = function (ray, obstacle) {

    var b = Vector2D.Subtract(ray.End, ray.Start);
    var d = obstacle.Size;

    var bDotDPerp = b.X * d.Y - b.Y * d.X;
    if (bDotDPerp === 0)
        return null;

    var c = Vector2D.Subtract(obstacle.Position, ray.Start);
    var t = (c.X * d.Y - c.Y * d.X) / bDotDPerp;
    if (t < 0 || t > 1)
        return null;

    var u = (c.X * b.Y - c.Y * b.X) / bDotDPerp;
    if (u < 0 || u > 1)
        return null;

    return Vector2D.Add(ray.Start, Vector2D.Multiply(b, t));
};
Collision.RayLineIntersect = function (ray, segment) {

    var rayDistance = Vector2D.DistanceVector(ray.End, ray.Start)
    var segDistance = Vector2D.DistanceVector(segment.End, segment.Start);

    var rayLength = Vector2D.Length(rayDistance);
    var segLength = Vector2D.Length(segDistance);

    if ((rayDistance.X / rayLength == segDistance.X / segLength) &&
        (rayDistance.Y / rayLength == segDistance.Y / segLength)) {
        return null;
    }

    var T2 = (rayDistance.X * (segment.Start.Y - ray.Start.Y) + rayDistance.Y * (ray.Start.X - segment.Start.X)) / (segDistance.X * rayDistance.Y - segDistance.Y * rayDistance.X);
    var T1 = (segment.Start.X + segDistance.X * T2 - ray.Start.X) / rayDistance.X;

    //Parametric check.
    if (T1 < 0) return null;
    if (T2 < 0 || T2 > 1) return null;
    if (isNaN(T1)) return null; //rayDistance.X = 0

    var result = { Point: new Vector2D(ray.Start.X + rayDistance.X * T1, ray.Start.Y + rayDistance.Y * T1), Param: T1 };

    return result;
}
Collision.GetIntersection = function (ray, segments) {
    var intersection = null;
    for (var segIndex = 0; segIndex < segments.length; segIndex++) {
        var tIntersect = Collision.RayLineIntersect(ray, segments[segIndex]);
        if (tIntersect == null) {
            continue;
        }
        if (!intersection || tIntersect.Param <= intersection.Param) {
            intersection = tIntersect;
        }
    }
    return intersection;
}

function Collider() { }
Collider.GetAllSegments = function (vehicle) {
    var segments = new Array();
    var center = vehicle.CenterPosition();
    for (var elIndex = 0; elIndex < world.FrameElements.length; elIndex++) {
        var element = world.FrameElements[elIndex];
        if (element.Loaded == false) {
            continue;
        }

        if (vehicle.Id == element.Id || Collider.prototype.isPrototypeOf(element) == false) {
            continue;
        }

        var elementDistance = Vector2D.Distance(element.CenterPosition(), center);
        if (elementDistance > vehicle.RadarRadius) {
            continue;
        }

        segments = segments.concat(element.GetSegments());
    }
    return segments;
};
Collider.prototype.Position = null;
Collider.prototype.Size = null;
Collider.prototype.GetSegments = function () {
    var segments = [
        new Line(this.Position, new Vector2D(this.Position.X, this.Position.Y + this.Size.Y)),
        new Line(new Vector2D(this.Position.X, this.Position.Y + this.Size.Y), new Vector2D(this.Position.X + this.Size.X, this.Position.Y + this.Size.Y)),
        new Line(new Vector2D(this.Position.X + this.Size.X, this.Position.Y + this.Size.Y), new Vector2D(this.Position.X + this.Size.X, this.Position.Y)),
        new Line(new Vector2D(this.Position.X + this.Size.X, this.Position.Y), this.Position)
    ];
    return segments;
};
Collider.prototype.CenterPosition = function () {
    return Vector2D.Add(this.Position, Vector2D.Multiply(this.Size, 0.5));
}

function Vehicle(id, x, y, target, disableVision) {
    this.Id = id;
    this.Position = new Vector2D(x, y);
    this.Direction = new Vector2D(0, 0);
    this.Size = new Vector2D(0, 0);
    this.LoadImage();

    if (target) {
        this.StartTarget = target;
        this.Target = target;
        this.Direction = Vector2D.Normalize(Vector2D.Subtract(this.Target, this.Position));
    }

    if (disableVision) {
        this.DisableVision = disableVision;
    }
}
Vehicle.ImageUrl = 'car.png';
Vehicle.prototype = new Collider();
Vehicle.prototype.Id = '';
Vehicle.prototype.Description = '';
Vehicle.prototype.Position = null;
Vehicle.prototype.StartTarget = null;
Vehicle.prototype.Target = null;
Vehicle.prototype.Direction = null;
Vehicle.prototype.Velocity = 0;
Vehicle.prototype.Size = null;
Vehicle.prototype.HalfSize = null;
Vehicle.prototype.RadarRadius = 120;
Vehicle.prototype.RadarRange = 45;
Vehicle.prototype.RadarAccuracy = 1;
Vehicle.prototype.Loaded = false;
Vehicle.prototype.Image = null;
Vehicle.prototype.RotationOffset = 8;
Vehicle.prototype.Render = function (context) {

    if (this.Loaded == false) {
        return;
    }

    var rotation = Vector2D.Radian(this.Direction);
    context.translate(this.Position.X, this.Position.Y);
    context.rotate(rotation);
    context.drawImage(this.Image, this.RotationOffset - this.HalfSize.X, -this.HalfSize.Y);
    context.rotate(-rotation);
    context.translate(-this.Position.X, -this.Position.Y);

};
Vehicle.prototype.Update = function (delta, context) {

    if (!this.Target) {
        return;
    }

    var goalDirection = Vector2D.Normalize(Vector2D.Subtract(this.Target, this.Position)); 
    this.Direction = Vector2D.Lerp(goalDirection, this.Direction, delta);
    this.Position  = Vector2D.Add(this.Position, Vector2D.Multiply(this.Direction, this.Velocity));
    var distance = Vector2D.Distance(this.Target, this.Position);

    
    if (distance > 1) {
        this.Velocity = 1;
    } else {
        this.Arrived();
    }

};
Vehicle.prototype.Arrived = function () {
    this.Velocity = 0;
    this.Target = null;
    //this.Target = new Vector2D(500, 400);
};
Vehicle.prototype.LoadImage = function () {
    var self = this;
    self.Image = new Image();
    self.Image.onload = function () {
        self.Size = new Vector2D(self.Image.width, self.Image.height);
        self.Loaded = true;
    };
    self.Image.src = Vehicle.ImageUrl;
    if (self.Image.complete) {
        self.Size = new Vector2D(self.Image.width, self.Image.height);
        self.HalfSize = Vector2D.Multiply(this.Size, 0.5);
        self.Loaded = true;
    }
};
Vehicle.prototype.ClearVision = function () {
    var container = $('#' + this.Id + ' .vision');
    container.empty();
}

function Tester(x, y, size) {
    this.Position = new Vector2D(x, y);
    if (size == undefined) {
        this.Size = new Vector2D(32, 32);
    } else {
        this.Size = size;
    }
}
Tester.prototype = new Collider();
Tester.prototype.Position = null;
Tester.prototype.Size = null;
Tester.prototype.Step = 0;
Tester.prototype.Render = function (context) {
    this.Step++;

    context.translate(this.Position.X, this.Position.Y);
    context.rotate(0);

    context.beginPath();
    context.moveTo(0, 0);
    context.rect(0, 0, this.Size.X, this.Size.Y);
    context.fillStyle = 'rgba(0,0,0,0.5)';
    context.fill();

    context.rotate(0);
    context.translate(-this.Position.X, -this.Position.Y);


};
Tester.prototype.Update = function (delta) { };




var fps = null;
var world = null;
$(document).ready(function () {

    var preloader = new Preloader();
    preloader.AddImage(Vehicle.ImageUrl);
    preloader.LoadComplete = function () {
        fps = new FPSMeter(document.getElementById('meter'), { theme: 'transparent', graph: 1, heat: 1, left: '0px', top: '0px', decimals: 2, threshold: 100, maxFps: 60, interval: 100 });

        world = new World('canvas_container');
        world.Debug = $('#debug').attr('checked');

        world.FrameStarted = function () { fps.resume(); fps.tickStart(); };
        world.FramePaused = function () { fps.pause(); };
        world.FrameEnded = function () { fps.tick(); };

        world.AddFrameElement(new Vehicle('AAA-0006', 50, 230, new Vector2D(200, 230)));

    };
    preloader.Load();

    $('#debug').change(function () {
        world.Debug = this.checked;
    });

});



