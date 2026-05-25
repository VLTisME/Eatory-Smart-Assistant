package runner

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"os"
	"runtime"
	"runtime/debug"
	"strings"
	"time"
)

const RunModeFile = 1

var ErrInvalidRunMode = errors.New("invalid run mode")

type Runner interface {
	Run(context.Context) error
	Close(context.Context) error
}

type Config struct {
	Concurrency              int
	MaxDepth                 int
	InputFile                string
	ResultsFile              string
	JSON                     bool
	LangCode                 string
	RegionCode               string
	Debug                    bool
	ExitOnInactivityDuration time.Duration
	Email                    bool
	GeoCoordinates           string
	Zoom                     int
	RunMode                  int
	Proxies                  []string
	FastMode                 bool
	Radius                   float64
	DisablePageReuse         bool
	ExtraReviews             bool
	GridBBox                 string
	GridCellKm               float64
	Version                  bool
}

func ParseConfig() *Config {
	cfg := Config{}
	var proxies string

	flag.IntVar(&cfg.Concurrency, "c", min(runtime.NumCPU()/2, 1), "sets the concurrency [default: half of CPU cores]")
	flag.IntVar(&cfg.MaxDepth, "depth", 10, "maximum scroll depth in search results [default: 10]")
	flag.StringVar(&cfg.ResultsFile, "results", "stdout", "path to the raw JSON results file [default: stdout]")
	flag.StringVar(&cfg.InputFile, "input", "", "path to the input file with queries")
	flag.StringVar(&cfg.LangCode, "lang", "en", "language code for Google [default: en]")
	flag.StringVar(&cfg.RegionCode, "region", "VN", "region code for Google results [default: VN]")
	flag.BoolVar(&cfg.Debug, "debug", false, "enable headful crawl")
	flag.DurationVar(&cfg.ExitOnInactivityDuration, "exit-on-inactivity", 0, "exit after inactivity duration, e.g. 5m")
	flag.BoolVar(&cfg.JSON, "json", false, "produce JSON output")
	flag.BoolVar(&cfg.Email, "email", false, "extract emails from websites")
	flag.StringVar(&cfg.GeoCoordinates, "geo", "", "set geo coordinates for search, e.g. 37.7749,-122.4194")
	flag.IntVar(&cfg.Zoom, "zoom", 15, "set zoom level 0-21 for search")
	flag.StringVar(&proxies, "proxies", "", "comma-separated proxy URLs")
	flag.BoolVar(&cfg.FastMode, "fast-mode", false, "fast mode with reduced data collection")
	flag.Float64Var(&cfg.Radius, "radius", 10000, "search radius in meters")
	flag.BoolVar(&cfg.DisablePageReuse, "disable-page-reuse", false, "disable page reuse in Playwright")
	flag.BoolVar(&cfg.ExtraReviews, "extra-reviews", false, "enable extra reviews collection")
	flag.StringVar(&cfg.GridBBox, "grid-bbox", "", "bounding box for grid scraping: minLat,minLon,maxLat,maxLon")
	flag.Float64Var(&cfg.GridCellKm, "grid-cell", 1.0, "grid cell size in km")
	flag.BoolVar(&cfg.Version, "version", false, "print build version")

	flag.Parse()

	if cfg.Version {
		info, ok := debug.ReadBuildInfo()
		if !ok {
			fmt.Println("build info not available")
			os.Exit(0)
		}

		version := info.Main.Version
		var commit string

		for _, s := range info.Settings {
			if s.Key == "vcs.revision" && len(s.Value) >= 7 {
				commit = s.Value[:7]
			}
		}

		if commit != "" {
			fmt.Printf("%s-%s\n", version, commit)
		} else {
			fmt.Println(version)
		}

		os.Exit(0)
	}

	if cfg.InputFile == "" {
		panic("InputFile must be provided")
	}

	if cfg.Concurrency < 1 {
		panic("Concurrency must be greater than 0")
	}

	if cfg.MaxDepth < 1 {
		panic("MaxDepth must be greater than 0")
	}

	if cfg.Zoom < 0 || cfg.Zoom > 21 {
		panic("Zoom must be between 0 and 21")
	}

	if proxies != "" {
		cfg.Proxies = strings.Split(proxies, ",")
	}

	cfg.RunMode = RunModeFile

	return &cfg
}

func Banner() {}
